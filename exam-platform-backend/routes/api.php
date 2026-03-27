<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfessorAuthController;
use App\Http\Controllers\ExamController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ExamSessionController;
use App\Http\Controllers\AdminControlController;
use App\Http\Controllers\ResultController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PDFController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\StudentGroupController;

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES
|--------------------------------------------------------------------------
*/

// Auth (professeurs)
Route::post('/register', [ProfessorAuthController::class, 'register']);
Route::post('/login', [ProfessorAuthController::class, 'login']);

// Exam access (public via token)
Route::get('/exam/access/{token}', [ExamController::class, 'accessByToken']);

// Exam session (student)
Route::post('/exam/join', [ExamSessionController::class, 'join']); // ⚠️ génère le token Sanctum
Route::get('/exam/session/{session}', [ExamSessionController::class, 'status']);
Route::post('/exam/log-activity', [ExamSessionController::class, 'logActivity']);
Route::post('/exam/submit', [ExamSessionController::class, 'submit']);
Route::get('/exam/{token}/take', [ExamSessionController::class, 'takeExam']);


// Student groups
Route::get('/student-groups', [StudentGroupController::class, 'index']);


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (AUTH SANCTUM)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |-------------------------
    | AUTH
    |-------------------------
    */
    Route::post('/logout', [ProfessorAuthController::class, 'logout']);

    // Get authenticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    /*
    |-------------------------
    | MODULES
    |-------------------------
    */
    Route::get('/modules', [ModuleController::class, 'index']);

    /*
    |-------------------------
    | EXAMS (CRUD)
    |-------------------------
    */
    Route::apiResource('exams', ExamController::class);

    // Token regeneration
    Route::post('/exams/{id}/regenerate-token', [ExamController::class, 'regenerateToken']);

    /*
    |-------------------------
    | QUESTIONS
    |-------------------------
    */
    Route::post('/exams/{exam}/questions', [QuestionController::class, 'store']);
    Route::put('/questions/{id}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

    /*
    |-------------------------
    | ADMIN CONTROL (VALIDATION)
    |-------------------------
    */
    Route::prefix('admin')->group(function () {
        Route::get('/pending/{exam}', [AdminControlController::class, 'pending']);
        Route::get('/accepted/{exam}', [AdminControlController::class, 'accepted']);
        Route::get('/alerts/{exam}', [AdminControlController::class, 'alerts']);

        Route::post('/validate/{session}', [AdminControlController::class, 'validate']);
        Route::post('/reject/{session}', [AdminControlController::class, 'reject']);
    });

    /*
    |-------------------------
    | RESULTS
    |-------------------------
    */
    Route::prefix('results')->group(function () {
        Route::get('/{exam}', [ResultController::class, 'index']);
        Route::get('/{session}/detail', [ResultController::class, 'detail']);
        Route::put('/answers/{answer}', [ResultController::class, 'grade']);
    });

    /*
    |-------------------------
    | REPORTS
    |-------------------------
    */
    Route::prefix('reports')->group(function () {
        Route::get('/{exam}', [ReportController::class, 'index']);
        Route::get('/{session}/detail', [ReportController::class, 'detail']);
        Route::put('/{report}', [ReportController::class, 'remark']);
    });

    /*
    |-------------------------
    | PDF EXPORT
    |-------------------------
    */
    Route::prefix('pdf')->group(function () {
        Route::get('/session/{session}', [PDFController::class, 'sessionPdf']);
        Route::get('/report/{session}', [PDFController::class, 'reportPdf']);
    });

});
