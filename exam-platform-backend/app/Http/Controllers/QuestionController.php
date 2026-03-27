<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\Request;
use App\Http\Requests\QuestionRequest;
use App\Http\Resources\QuestionResource;

class QuestionController extends Controller
{
    public function store(QuestionRequest $request, $examId)
    {
        $exam = Exam::where('professor_id', $request->user()->id)->findOrFail($examId);
        
        $question = $exam->questions()->create($request->validated());

        if ($request->has('options')) {
            foreach ($request->options as $option) {
                $question->options()->create($option);
            }
        }

        $exam->total_points = $exam->questions()->sum('points');
        $exam->save();

        return new QuestionResource($question->load('options'));
    }

    public function destroy(Request $request, $id)
    {
        $question = Question::findOrFail($id);
        $exam = Exam::where('professor_id', $request->user()->id)->findOrFail($question->exam_id);
        
        $question->delete();
        
        $exam->total_points = $exam->questions()->sum('points');
        $exam->save();

        return response()->json(['message' => 'Deleted']);
    }
    public function update(QuestionRequest $request, $id)
    {
        $question = Question::findOrFail($id);

        // Vérifie que la question appartient bien au prof connecté
        $exam = Exam::where('professor_id', $request->user()->id)
                    ->findOrFail($question->exam_id);

        // Mettre à jour la question
        $question->update($request->validated());

        // Supprimer les anciennes options et recréer si nécessaire
        if ($request->has('options')) {
            $question->options()->delete();
            foreach ($request->options as $option) {
                $question->options()->create($option);
            }
        }

        // Recalculer les points totaux de l’examen
        $exam->total_points = $exam->questions()->sum('points');
        $exam->save();

        return new QuestionResource($question->load('options'));
    }
}
