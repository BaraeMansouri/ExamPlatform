<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Copie d'examen</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #172033;
            font-size: 12px;
            line-height: 1.5;
            margin: 28px;
        }

        .header {
            border: 1px solid #d7e3f4;
            border-radius: 14px;
            padding: 22px;
            background: linear-gradient(135deg, #edf4ff 0%, #f9fbff 100%);
            margin-bottom: 18px;
        }

        .eyebrow {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1.4px;
            color: #3c66c4;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .title {
            font-size: 22px;
            font-weight: bold;
            color: #0f1f45;
            margin-bottom: 12px;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-table td {
            width: 50%;
            padding: 6px 0;
            vertical-align: top;
        }

        .meta-label {
            color: #6c7b96;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: block;
        }

        .meta-value {
            color: #172033;
            font-size: 13px;
            font-weight: bold;
        }

        .summary {
            width: 100%;
            margin: 16px 0 20px;
            border-collapse: separate;
            border-spacing: 10px 0;
        }

        .summary-card {
            border: 1px solid #d7e3f4;
            border-radius: 12px;
            padding: 14px;
            background: #fff;
        }

        .summary-label {
            display: block;
            color: #6c7b96;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
        }

        .summary-value {
            font-size: 18px;
            font-weight: bold;
            color: #0f1f45;
        }

        .question-card {
            border: 1px solid #dce6f5;
            border-radius: 14px;
            padding: 18px;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .question-top {
            margin-bottom: 12px;
        }

        .badge {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: .8px;
            margin-right: 6px;
        }

        .badge-question { background: #e7f0ff; color: #285cc7; }
        .badge-type { background: #fff4d8; color: #a06b00; }
        .badge-score { background: #e9fbef; color: #18794e; float: right; }

        .question-title {
            font-size: 14px;
            font-weight: bold;
            color: #172033;
            margin: 10px 0 12px;
        }

        .section-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6c7b96;
            margin-bottom: 6px;
        }

        .answer-box, .comment-box {
            border: 1px solid #e0e7f2;
            border-radius: 10px;
            padding: 12px;
            background: #f9fbfe;
            white-space: pre-wrap;
            word-break: break-word;
        }

        .comment-box {
            background: #fff;
        }

        .footer-note {
            margin-top: 20px;
            font-size: 10px;
            color: #7b8aa5;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="eyebrow">Copie corrig&eacute;e</div>
        <div class="title">{{ $session->exam->title }}</div>

        <table class="meta-table">
            <tr>
                <td>
                    <span class="meta-label">&Eacute;tudiant</span>
                    <span class="meta-value">{{ $session->username }}</span>
                </td>
                <td>
                    <span class="meta-label">Num&eacute;ro &eacute;tudiant</span>
                    <span class="meta-value">{{ $session->student_number }}</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="meta-label">Groupe</span>
                    <span class="meta-value">{{ $session->group_name }}</span>
                </td>
                <td>
                    <span class="meta-label">Date de soumission</span>
                    <span class="meta-value">{{ optional($session->submitted_at)->format('d/m/Y H:i') ?? 'N/A' }}</span>
                </td>
            </tr>
        </table>
    </div>

    <table class="summary">
        <tr>
            <td class="summary-card">
                <span class="summary-label">Score total</span>
                <span class="summary-value">{{ $session->total_score }} / {{ $session->max_score ?: $session->answers->sum(fn($answer) => $answer->question->points ?? 0) }}</span>
            </td>
            <td class="summary-card">
                <span class="summary-label">&Eacute;tat</span>
                <span class="summary-value">{{ $session->is_graded ? 'Corrig&eacute;e' : 'Non corrig&eacute;e' }}</span>
            </td>
            <td class="summary-card">
                <span class="summary-label">Suspicion</span>
                <span class="summary-value">{{ strtoupper($session->report->suspicion_level ?? 'low') }}</span>
            </td>
        </tr>
    </table>

    @foreach($session->answers as $index => $answer)
        @php
            $content = $answer->text_answer;

            if (!$content && is_array($answer->selected_options) && count($answer->selected_options)) {
                $content = implode(', ', $answer->selected_options);
            }

            if (!$content && !is_null($answer->boolean_answer)) {
                $content = $answer->boolean_answer ? 'Vrai' : 'Faux';
            }

            if (!$content && ($answer->code_html || $answer->code_css || $answer->code_js)) {
                $parts = [];
                if ($answer->code_html) $parts[] = "HTML:\n" . $answer->code_html;
                if ($answer->code_css) $parts[] = "CSS:\n" . $answer->code_css;
                if ($answer->code_js) $parts[] = "JS:\n" . $answer->code_js;
                $content = implode("\n\n", $parts);
            }
        @endphp

        <div class="question-card">
            <div class="question-top">
                <span class="badge badge-question">Question {{ $index + 1 }}</span>
                <span class="badge badge-type">{{ strtoupper($answer->question->type ?? 'QUESTION') }}</span>
                <span class="badge badge-score">{{ $answer->score }} / {{ $answer->question->points ?? 0 }} pts</span>
            </div>

            <div class="question-title">{{ $answer->question->content }}</div>

            <div class="section-label">R&eacute;ponse de l'&eacute;tudiant</div>
            <div class="answer-box">{{ $content ?: 'Aucune r&eacute;ponse fournie.' }}</div>

            @if(!empty($answer->professor_comment))
                <div style="height: 10px;"></div>
                <div class="section-label">Commentaire du professeur</div>
                <div class="comment-box">{{ $answer->professor_comment }}</div>
            @endif
        </div>
    @endforeach

    <div class="footer-note">
        Document g&eacute;n&eacute;r&eacute; automatiquement par ExamPlatform
    </div>
</body>
</html>
