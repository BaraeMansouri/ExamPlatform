<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamSession;
use Illuminate\Http\Request;
use App\Events\StudentWantsToJoin;
use App\Events\SuspiciousActivity;
use App\Services\SuspicionCalculator;
use App\Http\Resources\SessionResource;

class ExamSessionController extends Controller
{
    public function join(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'username' => 'required|string|max:255',
            'student_number' => 'required|string|max:255',
            'group_name' => 'required|string|max:255',
        ]);

        $exam = Exam::where('private_token', $request->token)->firstOrFail();

        $existingSession = ExamSession::where('exam_id', $exam->id)
            ->where('student_number', $request->student_number)
            ->first();

        if ($existingSession) {
            if ($existingSession->status === 'rejected') {
                $existingSession->answers()->delete();
                $existingSession->activityLogs()->delete();
                $existingSession->report()->delete();

                $existingSession->update([
                    'username' => $request->username,
                    'group_name' => $request->group_name,
                    'status' => 'pending',
                    'started_at' => null,
                    'submitted_at' => null,
                    'total_score' => 0,
                    'max_score' => 0,
                    'is_graded' => false,
                ]);

                broadcast(new StudentWantsToJoin(
                    $existingSession->id,
                    $exam->id,
                    $existingSession->username,
                    $existingSession->student_number
                ))->toOthers();

                return new SessionResource($existingSession->fresh());
            }

            return new SessionResource($existingSession);
        }

        $session = ExamSession::create([
            'exam_id' => $exam->id,
            'username' => $request->username,
            'student_number' => $request->student_number,
            'group_name' => $request->group_name,
            'status' => 'pending',
        ]);

        broadcast(new StudentWantsToJoin(
            $session->id,
            $exam->id,
            $session->username,
            $session->student_number
        ))->toOthers();

        return new SessionResource($session);
    }

    public function status(ExamSession $session)
    {
        return new SessionResource($session->load(['report', 'answers.question']));
    }

    public function logActivity(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:exam_sessions,id',
            'event_type' => 'required|string',
            'severity' => 'required|in:info,warning,danger',
            'description' => 'required|string',
        ]);

        $session = ExamSession::findOrFail($request->session_id);

        $session->activityLogs()->create($request->only([
            'event_type',
            'severity',
            'description'
        ]) + [
            'exam_id' => $session->exam_id,
        ]);

        if (in_array($request->severity, ['warning', 'danger'])) {
            broadcast(new SuspiciousActivity(
                $session->exam_id,
                $session->id,
                $request->event_type,
                $request->severity
            ));
        }

        return response()->json(['message' => 'Logged']);
    }

    public function submit(Request $request)
    {
        $request->validate([
            'session_id' => 'required|exists:exam_sessions,id',
            'answers' => 'required|array',
        ]);

        $session = ExamSession::with(['exam', 'activityLogs'])->findOrFail($request->session_id);

        if (! in_array($session->status, ['accepted', 'in_progress', 'submitted'], true)) {
            return response()->json(['message' => 'Session non autorisée'], 403);
        }

        if ($session->status === 'submitted') {
            return response()->json(['message' => 'Already submitted'], 403);
        }

        $session->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        foreach ($request->answers as $answer) {
            $session->answers()->updateOrCreate(
                ['question_id' => $answer['question_id']],
                $answer
            );
        }

        $danger = $session->activityLogs()->where('severity', 'danger')->count();
        $warning = $session->activityLogs()->where('severity', 'warning')->count();

        $level = app(SuspicionCalculator::class)->calculate($danger, $warning);

        $session->report()->create([
            'exam_id' => $session->exam_id,
            'professor_id' => $session->exam->professor_id,
            'suspicion_level' => $level,
            'danger_events' => $danger,
            'warning_events' => $warning,
        ]);

        return response()->json(['message' => 'Submitted']);
    }

    public function takeExam(Request $request, $token)
    {
        $exam = Exam::where('private_token', $token)
            ->where('is_active', true)
            ->with('questions.options')
            ->firstOrFail();

        $sessionId = $request->query('session_id');
        $session = $sessionId
            ? ExamSession::where('exam_id', $exam->id)->findOrFail($sessionId)
            : null;

        if ($session && ! in_array($session->status, ['accepted', 'in_progress', 'submitted'], true)) {
            return response()->json(['message' => 'Accès non autorisé à cet examen'], 403);
        }

        if ($session && $session->status === 'accepted') {
            $session->update(['status' => 'in_progress']);
        }

        $examData = [
            'id' => $exam->id,
            'title' => $exam->title,
            'duration' => $exam->timer_minutes,
            'total_points' => $exam->total_points,
        ];

        $questions = $exam->questions()->orderBy('order_index')->get()->map(function ($q) {
            return [
                'id' => $q->id,
                'type' => $q->type,
                'content' => $q->content,
                'points' => $q->points,
                'order_index' => $q->order_index,
                'code_template' => $q->code_template,
                'choices' => $q->options->pluck('label')->values(),
                'options' => $q->options->map(fn ($option) => [
                    'id' => $option->id,
                    'label' => $option->label,
                ])->values(),
            ];
        });

        return response()->json([
            'exam' => $examData,
            'questions' => $questions,
            'session' => $session ? new SessionResource($session) : null,
        ]);
    }
}
