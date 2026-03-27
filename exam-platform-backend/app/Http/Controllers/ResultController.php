<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Answer;
use App\Models\ExamSession;
use Illuminate\Http\Request;

class ResultController extends Controller
{
    public function index(Request $request, $examId)
    {
        $exam = Exam::where('professor_id', $request->user()->id)->findOrFail($examId);

        $sessions = ExamSession::with('report')
            ->where('exam_id', $exam->id)
            ->where('status', 'submitted')
            ->orderByDesc('submitted_at')
            ->get()
            ->map(function (ExamSession $session) {
                return [
                    'id' => $session->id,
                    'username' => $session->username,
                    'student_number' => $session->student_number,
                    'group_name' => $session->group_name,
                    'submitted_at' => optional($session->submitted_at)->toIso8601String(),
                    'total_score' => $session->total_score,
                    'max_score' => $session->max_score,
                    'is_graded' => $session->is_graded,
                    'status' => $session->status,
                    'suspicion_level' => $session->report?->suspicion_level,
                ];
            })
            ->values();

        return response()->json($sessions);
    }

    public function detail(Request $request, $sessionId)
    {
        $session = ExamSession::with(['exam', 'answers.question.options', 'report'])->findOrFail($sessionId);

        if ($session->exam->professor_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json($session);
    }

    public function grade(Request $request, $id)
    {
        $request->validate([
            'score' => 'required|integer|min:0',
            'is_correct' => 'required|boolean',
            'professor_comment' => 'nullable|string',
        ]);

        $answer = Answer::where('id', $id)
            ->whereHas('session.exam', function ($q) use ($request) {
                $q->where('professor_id', $request->user()->id);
            })
            ->with(['question', 'session.answers.question'])
            ->firstOrFail();

        $answer->update($request->only([
            'score',
            'is_correct',
            'professor_comment'
        ]));

        $session = $answer->session;
        $maxScore = $session->answers->sum(fn ($item) => (int) ($item->question->points ?? 0));
        $gradedAnswers = $session->answers->filter(function ($item) {
            return $item->score !== null || $item->professor_comment !== null;
        })->count();

        $session->update([
            'total_score' => $session->answers()->sum('score'),
            'max_score' => $maxScore,
            'is_graded' => $gradedAnswers === $session->answers->count(),
        ]);

        return response()->json($answer);
    }
}
