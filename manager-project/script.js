// =============================================
// MANAGER PROJECT — script.js
// Edit section titles and body content below.
// =============================================

// --- Section Data ---
// Each section has a title and HTML body content.
// Replace PLACEHOLDER text with your real content.

const sections = [
  {
    title: "Section 1: Modern Manager Mindset",
    body: `
      <p>
        <!-- PLACEHOLDER: Introduce the concept of the modern manager mindset here.
             What does it mean to lead in today's workplace? -->
        The role of a manager has shifted dramatically over the past decade.
        Today's managers must balance technical knowledge, emotional intelligence,
        and adaptability in an ever-changing environment.
      </p>
      <p>
        <!-- PLACEHOLDER: Add key themes, readings, or talking points for this section. -->
        Key themes to consider:
      </p>
      <ul>
        <li>Servant leadership vs. traditional top-down authority</li>
        <li>Psychological safety in teams</li>
        <li>Growth mindset as a leadership practice</li>
      </ul>
      <span class="placeholder-note">
        &#9998; Placeholder content — replace with your course material for Section 1.
      </span>
    `
  },
  {
    title: "Section 2: Managerial Self-Assessment",
    body: `
      <p>
        <!-- PLACEHOLDER: Frame the self-assessment exercise here.
             What dimensions are being evaluated? -->
        Effective managers regularly reflect on their own strengths, blind spots,
        and areas for growth. This section invites honest self-examination.
      </p>
      <p>
        <!-- PLACEHOLDER: List the self-assessment dimensions or reflection prompts. -->
        Reflect on the following areas:
      </p>
      <ul>
        <li>Communication clarity and listening habits</li>
        <li>Decision-making under pressure</li>
        <li>How you give and receive feedback</li>
        <li>Your default conflict resolution style</li>
      </ul>
      <span class="placeholder-note">
        &#9998; Placeholder content — replace with your self-assessment tool or prompts for Section 2.
      </span>
    `
  },
  {
    title: "Section 3: Managing Through Disruption",
    body: `
      <p>
        <!-- PLACEHOLDER: Describe the context of managing during disruption —
             could be organizational change, market shifts, or crisis. -->
        Disruption is no longer an exception — it is a constant. Managers who
        thrive during uncertainty share certain practices and mindsets.
      </p>
      <p>
        <!-- PLACEHOLDER: Add frameworks, case studies, or key lessons here. -->
        Core practices for navigating disruption:
      </p>
      <ul>
        <li>Maintaining team stability through transparent communication</li>
        <li>Prioritizing ruthlessly when resources are constrained</li>
        <li>Building resilience before a crisis, not during</li>
        <li>Leading with empathy when people are anxious</li>
      </ul>
      <span class="placeholder-note">
        &#9998; Placeholder content — replace with your course material for Section 3.
      </span>
    `
  },
  {
    title: "Section 4: Manager's Playbook",
    body: `
      <p>
        <!-- PLACEHOLDER: Introduce the idea of a personal manager's playbook —
             a set of go-to strategies and principles. -->
        A playbook is a curated set of tools and strategies a manager can rely on
        across different situations. Building yours takes reflection and iteration.
      </p>
      <p>
        <!-- PLACEHOLDER: List playbook categories or example plays. -->
        Common playbook categories:
      </p>
      <ul>
        <li>One-on-one conversation frameworks</li>
        <li>Team goal-setting and check-in rhythms</li>
        <li>How to run effective meetings</li>
        <li>Escalation and delegation guidelines</li>
      </ul>
      <span class="placeholder-note">
        &#9998; Placeholder content — replace with your playbook framework for Section 4.
      </span>
    `
  },
  {
    title: "Section 5: Mentorship Reflection",
    body: `
      <p>
        <!-- PLACEHOLDER: Frame the role of mentorship in management development.
             This could cover being mentored or mentoring others. -->
        Mentorship accelerates growth for both the mentor and the mentee.
        Reflecting on these relationships surfaces patterns in how you learn and lead.
      </p>
      <p>
        <!-- PLACEHOLDER: Add reflection prompts or frameworks for this section. -->
        Reflection prompts:
      </p>
      <ul>
        <li>Who has been a significant mentor in your career, and why?</li>
        <li>What did you learn about yourself through that relationship?</li>
        <li>How are you currently mentoring or developing others?</li>
        <li>What does good mentorship look like in your context?</li>
      </ul>
      <span class="placeholder-note">
        &#9998; Placeholder content — replace with your mentorship reflection activity for Section 5.
      </span>
    `
  }
];

// --- State ---
let currentSection = 1; // 1-based index

// --- Screen helpers ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// --- Render a section by 1-based number ---
function renderSection(num) {
  const data = sections[num - 1];
  const total = sections.length;

  document.getElementById('section-title').textContent = data.title;
  document.getElementById('section-body').innerHTML = data.body;
  document.getElementById('section-counter').textContent = `Section ${num} of ${total}`;
  document.getElementById('progress-fill').style.width = `${(num / total) * 100}%`;

  document.getElementById('btn-back').disabled = (num === 1);
  document.getElementById('btn-next').textContent = (num === total) ? 'Finish' : 'Next';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Navigation ---
function goToSection(num) {
  currentSection = num;
  renderSection(currentSection);
  showScreen('screen-section');
}

function navigate(direction) {
  const next = currentSection + direction;

  if (next < 1) {
    // Go back to title
    showScreen('screen-title');
    return;
  }

  if (next > sections.length) {
    // Go to summary
    showScreen('screen-summary');
    return;
  }

  currentSection = next;
  renderSection(currentSection);
}

function restart() {
  currentSection = 1;
  renderSection(currentSection);
  showScreen('screen-title');
}

// --- Init: show title screen on load ---
showScreen('screen-title');
