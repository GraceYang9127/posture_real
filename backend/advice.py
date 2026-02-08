def generate_advice(metrics):
    advice = []

    overall = metrics.get("overallScore")
    head = metrics.get("head_dev_deg")
    torso = metrics.get("torso_dev_deg")
    stability = metrics.get("stability_std_dev_deg")
    duration = metrics.get("session_duration_sec")

    # ---- Head posture ----
    if head is not None:
        if head > 12:
            advice.append(
                "Your head leans forward noticeably. Try gently tucking your chin and imagining a string pulling the top of your head upward."
            )
        elif head > 8:
            advice.append(
                "Your head posture is slightly forward. Focus on keeping your ears aligned over your shoulders."
            )
        else:
            advice.append(
                "Your head posture looks good! Keep maintaining that neutral alignment."
            )

    # ---- Torso posture ----
    if torso is not None:
        if torso > 10:
            advice.append(
                "Your upper body leans forward quite a bit. Engage your core and think about stacking your ribcage over your hips."
            )
        elif torso > 6:
            advice.append(
                "Your torso posture is decent, but you may benefit from sitting or standing a little taller."
            )
        else:
            advice.append(
                "Your torso posture looks solid! Keep up the good work maintaining that upright position."
            )

    # ---- Stability ----
    if stability is not None:
        if stability > 6:
            advice.append(
                "Your posture varies a lot during the session. Try to pause periodically and reset your posture."
            )
        elif stability > 4:
            advice.append(
                "Your posture is mostly stable, but small adjustments throughout the session could help."
            )
        else:
            advice.append(
                "Your posture is very stable throughout the session. Great job maintaining that consistency!"
            )

    # ---- Session duration ----
    if duration is not None and duration < 30:
        advice.append(
            "This was a short session. Longer practice sessions will give more reliable posture feedback."
        )

    # ---- Fallback ----
    if not advice:
        advice.append(
            "Nice work! Your posture metrics look solid. Keep maintaining this form."
        )

    return advice
