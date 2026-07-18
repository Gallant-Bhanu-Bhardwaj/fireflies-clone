"""Seed the database with realistic mock data.

Run with:  python seed.py   (from the backend/ directory)

Drops and recreates all tables each run so it's idempotent — safe to re-run
while developing without piling up duplicate rows.
"""

from datetime import date, datetime, timedelta

from database import Base, SessionLocal, engine
import models


def build_segments(lines):
    """Turn a list of (speaker, text) tuples into TranscriptSegment kwargs.

    Timestamps are generated automatically with a fixed ~8s gap per line so the
    seed data always has strictly increasing, non-overlapping times.
    """
    segments = []
    cursor = 0.0
    for i, (speaker, text) in enumerate(lines):
        duration = 6.0 + (len(text) % 5)  # vary line length a little for realism
        segments.append(
            models.TranscriptSegment(
                speaker_name=speaker,
                start_time=round(cursor, 1),
                end_time=round(cursor + duration, 1),
                text=text,
                order_index=i,
            )
        )
        cursor += duration + 2.0  # 2s pause between speakers
    return segments


def run():
    # Fresh start every run
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Single demo user (no real auth) ──────────────────────────────────
        demo = models.User(id=1, name="Demo User", email="demo@fireflies.test")
        db.add(demo)

        # ── Participant pool (reused across meetings via M:N) ────────────────
        names = [
            "Priya Sharma", "Marcus Chen", "Elena Rodriguez", "James Okafor",
            "Sofia Rossi", "David Kim", "Aisha Patel", "Tom Bennett",
            "Rachel Green", "Omar Haddad",
        ]
        participants = {name: models.Participant(name=name) for name in names}
        db.add_all(participants.values())
        db.flush()  # assign ids so we can reference them below

        base_date = datetime(2026, 7, 17, 10, 0, 0)

        # ── Meeting 1: Q3 Product Roadmap Sync ───────────────────────────────
        m1 = models.Meeting(
            title="Q3 Product Roadmap Sync",
            date=base_date - timedelta(days=1),
            duration_seconds=2820,
            owner_id=1,
            tags=["product", "roadmap", "planning"],
            participants=[participants["Priya Sharma"], participants["Marcus Chen"],
                          participants["Elena Rodriguez"], participants["David Kim"]],
        )
        m1.transcript_segments = build_segments([
            ("Priya Sharma", "Alright everyone, let's kick off the Q3 roadmap sync. Main goal today is to lock the top three priorities."),
            ("Marcus Chen", "Thanks Priya. From engineering's side, the biggest item is the analytics dashboard rebuild."),
            ("Elena Rodriguez", "Design has the new dashboard mocks ready. I can share them in Figma right after this call."),
            ("David Kim", "On data, we'll need the events pipeline stable before the dashboard can ship. That's still a risk."),
            ("Priya Sharma", "Good callout. Let's treat the pipeline hardening as a dependency, not a separate initiative."),
            ("Marcus Chen", "Agreed. Second priority I'd propose is the mobile push notifications feature."),
            ("Elena Rodriguez", "Users have been asking for that for months. It scored highest in the last survey."),
            ("David Kim", "Third could be the SSO integration for enterprise accounts. Sales keeps flagging it."),
            ("Priya Sharma", "Let's park SSO as a strong fourth. I don't want to overcommit the quarter."),
            ("Marcus Chen", "Fair. So dashboard, pipeline hardening, and push notifications as the committed three."),
            ("Elena Rodriguez", "Works for me. I'll get design specs for push notifications done by end of next week."),
            ("David Kim", "I'll write up the pipeline hardening plan and share estimates."),
            ("Priya Sharma", "Perfect. Let's reconvene in two weeks to check progress. Thanks all."),
        ])
        m1.summary = models.Summary(
            overview_text=(
                "The team aligned on three committed priorities for Q3: rebuilding the analytics "
                "dashboard, hardening the events data pipeline as a prerequisite, and shipping mobile "
                "push notifications. Enterprise SSO was deprioritized to a fourth item to avoid "
                "overcommitting the quarter."
            ),
            key_topics=["Analytics dashboard rebuild", "Data pipeline hardening",
                        "Mobile push notifications", "Enterprise SSO"],
        )
        m1.action_items = [
            models.ActionItem(text="Share new dashboard mocks in Figma", assignee="Elena Rodriguez",
                              is_completed=True, due_date=date(2026, 7, 18)),
            models.ActionItem(text="Write up pipeline hardening plan with estimates", assignee="David Kim",
                              is_completed=False, due_date=date(2026, 7, 24)),
            models.ActionItem(text="Deliver design specs for push notifications", assignee="Elena Rodriguez",
                              is_completed=False, due_date=date(2026, 7, 27)),
            models.ActionItem(text="Schedule two-week roadmap check-in", assignee="Priya Sharma",
                              is_completed=True, due_date=date(2026, 7, 20)),
        ]

        # ── Meeting 2: Sales Pipeline Review ─────────────────────────────────
        m2 = models.Meeting(
            title="Sales Pipeline Review",
            date=base_date - timedelta(days=3),
            duration_seconds=1980,
            owner_id=1,
            tags=["sales", "pipeline"],
            participants=[participants["James Okafor"], participants["Rachel Green"],
                          participants["Tom Bennett"]],
        )
        m2.transcript_segments = build_segments([
            ("James Okafor", "Let's walk the pipeline top to bottom. We're at 68% of the quarterly number with three weeks left."),
            ("Rachel Green", "The Acme Corp deal is the big one. They're in final procurement review."),
            ("Tom Bennett", "I spoke with their CFO yesterday. Pricing is approved, they just need legal signoff."),
            ("James Okafor", "That's a hundred and forty K. If it lands this month we're basically at target."),
            ("Rachel Green", "The Globex renewal is at risk though. Their champion left the company last week."),
            ("Tom Bennett", "I'll set up an intro call with the new VP of Ops to rebuild the relationship."),
            ("James Okafor", "Do it fast. Renewals slip when the champion disappears."),
            ("Rachel Green", "On new logos, I've got two mid-market deals that could close early next quarter."),
            ("Tom Bennett", "The Initech demo went really well. They asked about the enterprise SSO feature."),
            ("James Okafor", "That keeps coming up. I'll flag it to product again after this."),
            ("Rachel Green", "I'll update the forecast in the CRM tonight so numbers are clean for Monday."),
            ("James Okafor", "Great. Let's push hard on Acme and Globex this week. Thanks team."),
        ])
        m2.summary = models.Summary(
            overview_text=(
                "Sales is tracking at 68% of the quarterly target with three weeks remaining. The $140K "
                "Acme Corp deal is close to signing pending legal review and would nearly hit target. The "
                "Globex renewal is at risk after their champion departed, and enterprise SSO surfaced again "
                "as a recurring prospect ask."
            ),
            key_topics=["Acme Corp deal", "Globex renewal risk", "Quarterly target", "SSO demand"],
        )
        m2.action_items = [
            models.ActionItem(text="Chase legal signoff on Acme Corp contract", assignee="Tom Bennett",
                              is_completed=False, due_date=date(2026, 7, 21)),
            models.ActionItem(text="Set up intro call with Globex's new VP of Ops", assignee="Tom Bennett",
                              is_completed=False, due_date=date(2026, 7, 20)),
            models.ActionItem(text="Update Q3 forecast in CRM", assignee="Rachel Green",
                              is_completed=True, due_date=date(2026, 7, 15)),
            models.ActionItem(text="Re-flag enterprise SSO demand to product", assignee="James Okafor",
                              is_completed=False, due_date=date(2026, 7, 19)),
        ]

        # ── Meeting 3: Engineering Standup ───────────────────────────────────
        m3 = models.Meeting(
            title="Engineering Standup",
            date=base_date - timedelta(hours=26),
            duration_seconds=900,
            owner_id=1,
            tags=["engineering", "standup"],
            participants=[participants["Marcus Chen"], participants["David Kim"],
                          participants["Aisha Patel"]],
        )
        m3.transcript_segments = build_segments([
            ("Marcus Chen", "Quick standup. Let's go around. Aisha, you first."),
            ("Aisha Patel", "Yesterday I finished the pagination refactor on the meetings list endpoint."),
            ("Aisha Patel", "Today I'm picking up the search-by-title query. No blockers."),
            ("David Kim", "I merged the events pipeline retry logic. Staging's been stable overnight."),
            ("David Kim", "Today I'm adding metrics so we can actually see the retry rate. No blockers."),
            ("Marcus Chen", "Nice. I'm still on the CI flakiness. Two integration tests fail intermittently."),
            ("Aisha Patel", "Is that the transcript ordering test? I saw it fail on my PR too."),
            ("Marcus Chen", "Yeah, it's a timestamp race. I think the fixture data needs deterministic ordering."),
            ("David Kim", "The seed script generates increasing timestamps now, that might help the fixtures."),
            ("Marcus Chen", "Good point, I'll reuse that logic. Anything else? Alright, that's it, back to work."),
        ])
        m3.summary = models.Summary(
            overview_text=(
                "Daily engineering standup. Aisha completed the meetings-list pagination refactor and moved "
                "onto search-by-title. David merged pipeline retry logic that stabilized staging and is now "
                "adding observability metrics. Marcus is chasing CI flakiness caused by a timestamp race in "
                "the transcript ordering integration test."
            ),
            key_topics=["Pagination refactor", "Pipeline retry logic", "CI flakiness"],
        )
        m3.action_items = [
            models.ActionItem(text="Implement search-by-title query", assignee="Aisha Patel",
                              is_completed=False, due_date=date(2026, 7, 18)),
            models.ActionItem(text="Add retry-rate metrics to events pipeline", assignee="David Kim",
                              is_completed=False, due_date=date(2026, 7, 18)),
            models.ActionItem(text="Fix timestamp race in transcript ordering test", assignee="Marcus Chen",
                              is_completed=False, due_date=date(2026, 7, 19)),
        ]

        # ── Meeting 4: Client Onboarding Call - Acme Corp ────────────────────
        m4 = models.Meeting(
            title="Client Onboarding Call - Acme Corp",
            date=base_date - timedelta(days=5),
            duration_seconds=2460,
            owner_id=1,
            tags=["client", "onboarding", "sales"],
            participants=[participants["Rachel Green"], participants["Sofia Rossi"],
                          participants["Omar Haddad"], participants["Aisha Patel"]],
        )
        m4.transcript_segments = build_segments([
            ("Rachel Green", "Welcome to the team, Acme! I'm Rachel, your account lead, and I'll hand off to Sofia for onboarding."),
            ("Sofia Rossi", "Thanks Rachel. Omar, great to meet you. Let's map out your first 30 days on the platform."),
            ("Omar Haddad", "Appreciate it. Our main goal is to get all fifty of our reps onboarded by end of month."),
            ("Sofia Rossi", "Totally doable. We'll start with an admin setup session, then a live training for the reps."),
            ("Omar Haddad", "One concern — our data lives in Salesforce. How does the integration work?"),
            ("Aisha Patel", "We have a native Salesforce connector. I'll walk your ops team through the OAuth setup this week."),
            ("Omar Haddad", "Perfect. Security will ask about data residency, just so you know."),
            ("Aisha Patel", "Understood. I'll send our SOC 2 report and the data processing addendum today."),
            ("Sofia Rossi", "For training, does Thursday afternoon work for the first admin session?"),
            ("Omar Haddad", "Thursday works. I'll get the calendar invites out to our side."),
            ("Rachel Green", "Wonderful. Omar, you'll also get a dedicated Slack channel for quick questions."),
            ("Sofia Rossi", "And I'll share the onboarding checklist doc right after this call."),
            ("Omar Haddad", "This is a great start. Thanks everyone, looking forward to it."),
        ])
        m4.summary = models.Summary(
            overview_text=(
                "Kickoff onboarding call with new client Acme Corp. The plan is to onboard all 50 of Acme's "
                "reps within 30 days, starting with an admin setup session and live rep training. Key "
                "technical items are the native Salesforce connector setup and satisfying Acme security's "
                "data residency and compliance requirements."
            ),
            key_topics=["30-day onboarding plan", "Salesforce integration",
                        "Security & compliance", "Rep training"],
        )
        m4.action_items = [
            models.ActionItem(text="Walk Acme ops team through Salesforce OAuth setup", assignee="Aisha Patel",
                              is_completed=False, due_date=date(2026, 7, 22)),
            models.ActionItem(text="Send SOC 2 report and DPA to Acme security", assignee="Aisha Patel",
                              is_completed=True, due_date=date(2026, 7, 13)),
            models.ActionItem(text="Share onboarding checklist doc", assignee="Sofia Rossi",
                              is_completed=True, due_date=date(2026, 7, 12)),
            models.ActionItem(text="Send calendar invites for Thursday admin session", assignee="Omar Haddad",
                              is_completed=False, due_date=date(2026, 7, 16)),
        ]

        # ── Meeting 5: Marketing Campaign Retro ──────────────────────────────
        m5 = models.Meeting(
            title="Marketing Campaign Retro",
            date=base_date - timedelta(days=7),
            duration_seconds=2100,
            owner_id=1,
            tags=["marketing", "retro"],
            participants=[participants["Elena Rodriguez"], participants["Sofia Rossi"],
                          participants["Priya Sharma"]],
        )
        m5.transcript_segments = build_segments([
            ("Sofia Rossi", "Let's retro the summer launch campaign. Overall it beat the lead target by twenty percent."),
            ("Elena Rodriguez", "The video ads massively outperformed the static ones. Almost double the click-through."),
            ("Priya Sharma", "That tracks with what we saw last quarter. Video is clearly where the budget should go."),
            ("Sofia Rossi", "The webinar drove the highest quality leads, but attendance was lower than we hoped."),
            ("Elena Rodriguez", "The registration page had a clunky form. I think that hurt conversion."),
            ("Priya Sharma", "Can we simplify the form to just name and email for the next one?"),
            ("Sofia Rossi", "Yes, fewer fields always wins. Let's make that a standing rule for gated content."),
            ("Elena Rodriguez", "The email sequence open rates were solid but the third email underperformed."),
            ("Sofia Rossi", "The subject line was too vague. We should A/B test subject lines going forward."),
            ("Priya Sharma", "What didn't work at all?"),
            ("Sofia Rossi", "The paid LinkedIn spend had a terrible cost per lead. I'd cut it next time."),
            ("Elena Rodriguez", "Agreed, reallocate that to video. I'll draft the budget proposal for the fall campaign."),
            ("Sofia Rossi", "Great retro, team. Lots to carry forward. Thanks everyone."),
        ])
        m5.summary = models.Summary(
            overview_text=(
                "Retrospective on the summer launch campaign, which exceeded its lead target by 20%. Video "
                "ads dramatically outperformed static creative and the webinar produced the highest-quality "
                "leads despite low attendance driven by a clunky registration form. LinkedIn paid spend had "
                "a poor cost per lead and is a candidate to cut in favor of video."
            ),
            key_topics=["Video vs static ads", "Webinar lead quality",
                        "Registration form friction", "Paid channel ROI"],
        )
        m5.action_items = [
            models.ActionItem(text="Simplify webinar registration form to name + email", assignee="Elena Rodriguez",
                              is_completed=False, due_date=date(2026, 7, 24)),
            models.ActionItem(text="Set up A/B testing on email subject lines", assignee="Sofia Rossi",
                              is_completed=False, due_date=date(2026, 7, 28)),
            models.ActionItem(text="Draft fall campaign budget proposal reallocating LinkedIn spend to video",
                              assignee="Elena Rodriguez", is_completed=False, due_date=date(2026, 7, 30)),
            models.ActionItem(text="Share summer campaign metrics deck", assignee="Sofia Rossi",
                              is_completed=True, due_date=date(2026, 7, 14)),
        ]

        db.add_all([m1, m2, m3, m4, m5])
        db.commit()

        print("Seed complete:")
        print(f"  users:        {db.query(models.User).count()}")
        print(f"  participants: {db.query(models.Participant).count()}")
        print(f"  meetings:     {db.query(models.Meeting).count()}")
        print(f"  segments:     {db.query(models.TranscriptSegment).count()}")
        print(f"  summaries:    {db.query(models.Summary).count()}")
        print(f"  action items: {db.query(models.ActionItem).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
