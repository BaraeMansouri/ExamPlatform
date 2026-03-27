<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->enum('type', ['text', 'radio', 'checkbox', 'code_html', 'true_false']);
            $table->text('content');
            $table->integer('points')->default(1);
            $table->integer('order_index')->default(0);
            $table->text('code_template')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('questions');
    }
};
