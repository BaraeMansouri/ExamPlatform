<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\StudentReport;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request, $examId)
    {
    $exam = Exam::where('id', $examId)
        ->where('professor_id', $request->user()->id)
        ->firstOrFail();

    return response()->json(
        StudentReport::with('session')
            ->where('exam_id', $examId)
            ->get()
    );
}

    public function detail(Request $request, $sessionId)
    {
        $report = StudentReport::with(['session.activityLogs', 'exam'])->where('session_id', $sessionId)->firstOrFail();
        if ($report->professor_id !== $request->user()->id) {
            abort(403);
        }
        return response()->json($report);
    }

    public function remark(Request $request, $id)
    {
        $request->validate([
            'professor_remark' => 'required|string',
        ]);

        $report = StudentReport::where('professor_id', $request->user()->id)->findOrFail($id);
        $report->update(['professor_remark' => $request->professor_remark]);

        return response()->json($report);
    }
}
