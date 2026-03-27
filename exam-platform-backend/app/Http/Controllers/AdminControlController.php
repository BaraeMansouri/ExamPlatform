<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use App\Events\SessionAccepted;
use App\Events\SessionRejected;

class AdminControlController extends Controller
{
    public function pending(Request $request, $examId)
    {
        $exam = Exam::where('professor_id', $request->user()->id)
            ->findOrFail($examId);

        $sessions = ExamSession::where('exam_id', $exam->id)
            ->where('status', 'pending')
            ->get();

        return response()->json($sessions);
    }

    public function validate(Request $request, $sessionId)
    {
        $session = ExamSession::with(['exam.questions.options'])->findOrFail($sessionId);

        abort_unless($session->exam->professor_id === $request->user()->id, 403);

        $session->update([
            'status' => 'accepted',
            'started_at' => now(),
        ]);

        broadcast(new SessionAccepted($session->id, $session->exam, $session->exam->questions));

        return response()->json(['message' => 'Étudiant accepté']);
    }

    public function reject(Request $request, $sessionId)
    {
        $session = ExamSession::findOrFail($sessionId);

        abort_unless($session->exam->professor_id === $request->user()->id, 403);

        $session->update(['status' => 'rejected']);

        broadcast(new SessionRejected($session->id));

        return response()->json(['message' => 'Étudiant refusé']);
    }

    public function accepted(Request $request, $examId)
    {
        $exam = Exam::where('professor_id', $request->user()->id)
            ->findOrFail($examId);

        $acceptedSessions = $exam->sessions()
            ->whereIn('status', ['accepted', 'in_progress'])
            ->get();

        return response()->json([
            'exam' => $exam->title,
            'accepted' => $acceptedSessions
        ]);
    }

    public function alerts(Request $request, $examId)
    {
        $exam = Exam::where('professor_id', $request->user()->id)
            ->findOrFail($examId);

        $logs = ActivityLog::with('session')
            ->where('exam_id', $exam->id)
            ->whereIn('severity', ['warning', 'danger'])
            ->latest('logged_at')
            ->limit(50)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'time' => optional($log->logged_at)->format('H:i:s'),
                    'studentName' => $log->session?->username ?? ('Session #'.$log->session_id),
                    'eventType' => $log->event_type,
                    'severity' => $log->severity,
                    'description' => $log->description,
                ];
            })
            ->values();

        return response()->json($logs);
    }
}
