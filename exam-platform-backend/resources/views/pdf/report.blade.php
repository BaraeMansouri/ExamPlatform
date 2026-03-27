<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport de surveillance</title>
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

        .section-card {
            border: 1px solid #dce6f5;
            border-radius: 14px;
            padding: 18px;
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .section-label {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6c7b96;
            margin-bottom: 6px;
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

        .badge-low { background: #e9fbef; color: #18794e; }
        .badge-medium { background: #fff7db; color: #9f6a00; }
        .badge-high, .badge-warning { background: #fff1dc; color: #b45309; }
        .badge-critical, .badge-danger { background: #ffe5e5; color: #b42318; }

        .log-item {
            border: 1px solid #e0e7f2;
            border-radius: 10px;
            padding: 12px;
            background: #f9fbfe;
            margin-bottom: 10px;
        }

        .log-meta {
            margin-bottom: 6px;
        }

        .remark-box {
            border: 1px solid #e0e7f2;
            border-radius: 10px;
            padding: 12px;
            background: #fff;
            white-space: pre-wrap;
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
    @php
        $level = strtolower($report->suspicion_level ?? 'low');
    @endphp

    <div class="header">
        <div class="eyebrow">Rapport de surveillance</div>
        <div class="title">{{ $report->exam->title ?? 'Examen' }}</div>

        <table class="meta-table">
            <tr>
                <td>
                    <span class="meta-label">&Eacute;tudiant</span>
                    <span class="meta-value">{{ $report->session->username ?? 'N/A' }}</span>
                </td>
                <td>
                    <span class="meta-label">Num&eacute;ro &eacute;tudiant</span>
                    <span class="meta-value">{{ $report->session->student_number ?? 'N/A' }}</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="meta-label">Session</span>
                    <span class="meta-value">#{{ $report->session_id }}</span>
                </td>
                <td>
                    <span class="meta-label">Niveau de suspicion</span>
                    <span class="badge badge-{{ $level }}">{{ strtoupper($report->suspicion_level ?? 'low') }}</span>
                </td>
            </tr>
        </table>
    </div>

    <table class="summary">
        <tr>
            <td class="summary-card">
                <span class="summary-label">Alertes critiques</span>
                <span class="summary-value">{{ $report->danger_events ?? 0 }}</span>
            </td>
            <td class="summary-card">
                <span class="summary-label">Avertissements</span>
                <span class="summary-value">{{ $report->warning_events ?? 0 }}</span>
            </td>
            <td class="summary-card">
                <span class="summary-label">Logs enregistr&eacute;s</span>
                <span class="summary-value">{{ $report->session->activityLogs->count() }}</span>
            </td>
        </tr>
    </table>

    <div class="section-card">
        <div class="section-label">Remarque du professeur</div>
        <div class="remark-box">{{ $report->professor_remark ?: 'Aucune remarque enregistr&eacute;e.' }}</div>
    </div>

    <div class="section-card">
        <div class="section-label">Journal d'activit&eacute;</div>
        @forelse($report->session->activityLogs as $log)
            <div class="log-item">
                <div class="log-meta">
                    <span class="badge badge-{{ strtolower($log->severity ?? 'low') }}">{{ strtoupper($log->severity ?? 'INFO') }}</span>
                    <strong>{{ optional($log->logged_at)->format('d/m/Y H:i:s') ?? $log->logged_at }}</strong>
                </div>
                <div>{{ $log->description ?: 'Aucune description.' }}</div>
            </div>
        @empty
            <div class="remark-box">Aucune activit&eacute; suspecte d&eacute;tect&eacute;e.</div>
        @endforelse
    </div>

    <div class="footer-note">
        Document g&eacute;n&eacute;r&eacute; automatiquement par ExamPlatform
    </div>
</body>
</html>
