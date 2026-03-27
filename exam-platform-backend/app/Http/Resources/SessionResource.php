<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exam_id' => $this->exam_id,
            'username' => $this->username,
            'student_number' => $this->student_number,
            'group_name' => $this->group_name,
            'status' => $this->status,
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'total_score' => $this->total_score,
            'max_score' => $this->max_score,
            'is_graded' => $this->is_graded,
            'report' => $this->whenLoaded('report'),
            'answers' => $this->whenLoaded('answers', function () {
                return $this->answers->map(function ($answer) {
                    return [
                        'id' => $answer->id,
                        'question_id' => $answer->question_id,
                        'text_answer' => $answer->text_answer,
                        'selected_options' => $answer->selected_options,
                        'boolean_answer' => $answer->boolean_answer,
                        'code_html' => $answer->code_html,
                        'code_css' => $answer->code_css,
                        'code_js' => $answer->code_js,
                        'score' => $answer->score,
                        'is_correct' => $answer->is_correct,
                        'professor_comment' => $answer->professor_comment,
                        'question' => $answer->question ? [
                            'id' => $answer->question->id,
                            'type' => $answer->question->type,
                            'content' => $answer->question->content,
                            'points' => $answer->question->points,
                        ] : null,
                    ];
                })->values();
            }),
        ];
    }
}
