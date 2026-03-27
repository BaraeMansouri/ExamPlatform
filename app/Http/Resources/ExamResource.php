<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'module' => [
                'id' => $this->module->id ?? null,
                'name' => $this->module->name ?? null,
            ],
            'group' => [
                'id' => $this->group->id ?? null,
                'name' => $this->group->name ?? null,
            ],
            'timer_minutes' => $this->timer_minutes,
            'private_token' => $request->user() ? $this->private_token : null,
            'token_used' => $this->token_used,
            'is_active' => $this->is_active,
            'status' => $this->status,
            'total_points' => $this->total_points,
            'questions' => QuestionResource::collection($this->whenLoaded('questions')),
            'created_at' => $this->created_at,
        ];
    }
}
