<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\StudentReport;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PDFController extends Controller
{
    public function sessionPdf(Request $request, $sessionId)
    {
        $session = ExamSession::with(['answers.question.options', 'exam', 'report'])
            ->whereHas('exam', function ($q) use ($request) {
                $q->where('professor_id', $request->user()->id);
            })
            ->findOrFail($sessionId);

        $pdf = Pdf::loadView('pdf.session', compact('session'))
            ->setPaper('a4');

        return $pdf->download('copie_' . $session->student_number . '.pdf');
    }

    public function reportPdf(Request $request, $sessionId)
    {
        $report = StudentReport::with([
                'session.activityLogs',
                'session',
                'exam',
            ])
            ->where('session_id', $sessionId)
            ->whereHas('exam', function ($query) use ($request) {
                $query->where('professor_id', $request->user()->id);
            })
            ->firstOrFail();

        $pdf = Pdf::loadView('pdf.report', ['report' => $report])->setPaper('a4');

        return $pdf->download('rapport_' . ($report->session->student_number ?: $report->session_id) . '.pdf');
    }
}
