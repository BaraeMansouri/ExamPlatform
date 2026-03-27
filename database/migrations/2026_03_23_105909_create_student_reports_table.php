<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('student_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->unique()->constrained('exam_sessions')->cascadeOnDelete();
            $table->foreignId('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignId('professor_id')->constrained('professors')->cascadeOnDelete();
            $table->enum('suspicion_level', ['low', 'medium', 'high', 'critical'])->default('low');
            $table->integer('danger_events')->default(0);
            $table->integer('warning_events')->default(0);
            $table->text('professor_remark')->nullable();
            $table->string('report_pdf_path')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('student_reports');
    }
};
