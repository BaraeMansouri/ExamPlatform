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

        return $this->withCorsHeaders(
            $request,
            $pdf->download('copie_' . $session->student_number . '.pdf')
        );
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

        return $this->withCorsHeaders(
            $request,
            $pdf->download('rapport_' . ($report->session->student_number ?: $report->session_id) . '.pdf')
        );
    }

    private function withCorsHeaders(Request $request, $response)
    {
        $origin = $request->headers->get('Origin');
        $allowedOrigins = array_filter([
            config('app.frontend_url'),
            env('FRONTEND_URL', 'http://localhost:5173'),
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ]);

        if ($origin && in_array($origin, $allowedOrigins, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Type');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
