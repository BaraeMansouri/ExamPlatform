<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->text('text_answer')->nullable();
            $table->json('selected_options')->nullable();
            $table->boolean('boolean_answer')->nullable();
            $table->json('choices')->nullable();
            $table->text('code_html')->nullable();
            $table->text('code_css')->nullable();
            $table->text('code_js')->nullable();
            $table->integer('score')->default(0);
            $table->boolean('is_correct')->default(false);
            $table->text('professor_comment')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('answers');
    }
};
