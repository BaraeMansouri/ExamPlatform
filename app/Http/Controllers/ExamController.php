<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Http\Requests\ExamRequest;
use App\Http\Resources\ExamResource;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $exams = Exam::where('professor_id', $request->user()->id)
            ->with('module', 'group')
            ->get();

        return ExamResource::collection($exams);
    }

    public function store(ExamRequest $request)
    {
        $data = $request->validated();

        $data['professor_id'] = $request->user()->id;
        $data['private_token'] = Str::uuid()->toString();
        $data['token_used'] = false;

        $exam = Exam::create($data);

        return new ExamResource($exam);
    }

    public function show(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('professor_id', $request->user()->id)
            ->with(['module', 'group', 'questions.options'])
            ->firstOrFail();

        return new ExamResource($exam);
    }

    public function update(ExamRequest $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('professor_id', $request->user()->id)
            ->firstOrFail();

        $exam->update($request->validated());

        return new ExamResource($exam);
    }

    public function destroy(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('professor_id', $request->user()->id)
            ->firstOrFail();

        $exam->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function accessByToken($token)
    {
        $exam = Exam::with('questions.options')
            ->where('private_token', $token)
            ->where('token_used', false)
            ->firstOrFail();

        return new ExamResource($exam);
    }

    public function regenerateToken(Request $request, $id)
    {
        $exam = Exam::where('id', $id)
            ->where('professor_id', $request->user()->id)
            ->firstOrFail();

        $exam->update([
            'private_token' => Str::uuid()->toString(),
            'token_used' => false
        ]);

        return response()->json([
            'private_token' => $exam->private_token
        ]);
    }
    public function joinExam(Request $request)
    {
        // Vérifie l'examen avec le token
        $exam = Exam::where('private_token', $request->token)
            ->where('token_used', false)
            ->firstOrFail();

        // Crée ou retrouve l'étudiant
        $user = User::firstOrCreate(
            ['student_number' => $request->student_number],
            ['name' => $request->username, 'group_name' => $request->group_name]
        );

        // Génère un token Sanctum
        $token = $user->createToken('exam')->plainTextToken;

        // Tu peux aussi créer une "session" si nécessaire
        $sessionId = Str::uuid()->toString();

        return response()->json([
            'token' => $token,
            'session_id' => $sessionId,
            'exam' => new ExamResource($exam),
        ]);
    }
}
