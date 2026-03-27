<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('exam_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->string('username');
            $table->string('student_number');
            $table->string('group_name');
            $table->enum('status', ['pending', 'accepted', 'rejected', 'in_progress', 'submitted', 'expired'])->default('pending');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->integer('total_score')->default(0);
            $table->integer('max_score')->default(0);
            $table->boolean('is_graded')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('exam_sessions');
    }
};
