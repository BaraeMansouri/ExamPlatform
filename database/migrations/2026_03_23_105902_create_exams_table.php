<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professor_id')->constrained('professors')->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('modules')->cascadeOnDelete();
            $table->foreignId('group_id')->constrained('student_groups')->cascadeOnDelete();
            $table->string('title');
            $table->integer('timer_minutes');
            $table->uuid('private_token')->unique();
            $table->boolean('token_used')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_read')->default(false);
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->integer('total_points')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('exams');
    }
};
