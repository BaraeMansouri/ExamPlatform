<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'content' => $this->content,
            'points' => $this->points,
            'order_index' => $this->order_index,
            'code_template' => $this->code_template,
            'options' => QuestionOptionResource::collection(
                $this->whenLoaded('options')
            ),
        ];
    }
}
