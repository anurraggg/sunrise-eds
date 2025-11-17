/* quiz.js
   EDS block: quiz
   - Exports async decorate(block)
   - Hard-coded quiz with 3 questions
   - Random result chosen from results array
   - Accessible (aria) and responsive
   - Uses only vanilla JS and DOM manipulation
*/

/* eslint-disable import/no-unresolved */
import { createOptimizedPicture } from '../../scripts/aem.js';

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.keys(attrs).forEach((k) => {
    if (k === 'class') {
      el.className = attrs[k];
    } else if (k === 'text') {
      el.textContent = attrs[k];
    } else if (k === 'html') {
      el.innerHTML = attrs[k];
    } else {
      el.setAttribute(k, attrs[k]);
    }
  });
  children.forEach((c) => {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c instanceof Node) el.appendChild(c);
  });
  return el;
}

/**
 * Returns a shallow copy of the quiz questions for internal use.
 * Listing every line / function: this is the data factory.
 * @returns {Object} quiz data
 */
function getQuizData() {
  return {
    title: 'MAKE YOUR MASALEDAANI',
    subtitle: "Questionnaire — pick one option for each question",
    questions: [
      {
        id: 'q1',
        question: "What's your favourite type of movie?",
        options: ['Action-Packed Thriller', 'Romantic Comedy', 'Mystery & Suspense'],
      },
      {
        id: 'q2',
        question: 'Which meal makes you happiest?',
        options: ['Street Food', 'Home Cooked Comfort', 'Fine Dining'],
      },
      {
        id: 'q3',
        question: 'How spicy do you like your food?',
        options: ['Bring the Heat', 'Mild & Comforting', 'Balanced & Aromatic'],
      },
    ],
    results: [
      {
        id: 'spice-1',
        title: 'Paneer Butter Masala',
        desc: "You love the spice of life, whether it's in your food or your city.",
        img: '/images/paneer-butter-masala.png',
      },
      {
        id: 'spice-2',
        title: 'Garam Masala',
        desc: 'Warm, aromatic, complex — you like layers of flavour.',
        img: '/images/garam-masala.png',
      },
      {
        id: 'spice-3',
        title: 'Chilli Powder',
        desc: "Bold and fiery — you like things with bite.",
        img: '/images/chilli-powder.png',
      },
    ],
  };
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param {Array} arr array to shuffle
 * @returns {Array} shuffled array
 */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Create the main DOM structure of the quiz and attach to block
 * @param {Element} block root block element
 * @param {Object} data quiz data
 * @returns {Object} references to dynamic parts
 */
function buildQuizDom(block, data) {
  // wrapper
  const wrapper = createEl('div', { class: 'quiz-wrapper' });

  // left content
  const left = createEl('div', { class: 'quiz-headline' });
  const kicker = createEl('div', { class: 'quiz-kicker' });
  const title = createEl('h2', { class: 'quiz-title', text: data.title });
  const sub = createEl('div', { class: 'quiz-sub', text: data.subtitle });
  left.appendChild(kicker);
  left.appendChild(title);
  left.appendChild(sub);

  // dynamic question container
  const progress = createEl('div', { class: 'quiz-progress', text: 'Question 1 / 3' });
  const questionEl = createEl('div', { class: 'quiz-question', text: '' });
  const optionsEl = createEl('div', { class: 'quiz-options' });

  left.appendChild(progress);
  left.appendChild(questionEl);
  left.appendChild(optionsEl);

  // right side (image / next)
  const side = createEl('div', { class: 'quiz-side' });
  const nextBtn = createEl('button', {
    class: 'quiz-next-btn',
    type: 'button',
    text: 'Next',
    'aria-label': 'Next question',
    disabled: 'true',
  });

  side.appendChild(nextBtn);

  wrapper.appendChild(left);
  wrapper.appendChild(side);

  // replace block contents
  block.textContent = '';
  block.appendChild(wrapper);

  return {
    wrapper,
    progress,
    questionEl,
    optionsEl,
    nextBtn,
    side,
  };
}

/**
 * Render a question into the DOM
 * @param {Object} refs refs returned from buildQuizDom
 * @param {Object} q question object
 * @param {Number} qIndex index of question
 * @param {Object} state quiz state to modify
 */
function renderQuestion(refs, q, qIndex, state) {
  const { progress, questionEl, optionsEl } = refs;
  progress.textContent = `Question ${qIndex + 1} / ${state.total}`;
  questionEl.textContent = q.question;

  // clear previous options
  optionsEl.innerHTML = '';

  q.options.forEach((opt) => {
    const btn = createEl('button', {
      class: 'quiz-option',
      type: 'button',
      text: opt,
      role: 'button',
      'aria-pressed': 'false',
    });

    btn.addEventListener('click', () => {
      // toggle pressed state within options (single-select)
      const siblings = Array.from(optionsEl.querySelectorAll('.quiz-option'));
      siblings.forEach((s) => s.setAttribute('aria-pressed', 'false'));
      btn.setAttribute('aria-pressed', 'true');

      // record answer (we only need index of option or text)
      state.answers[q.id] = opt;

      // enable next button
      refs.nextBtn.removeAttribute('disabled');
      refs.nextBtn.focus();
    });

    optionsEl.appendChild(btn);
  });

  // ensure next button disabled until selection
  refs.nextBtn.setAttribute('disabled', 'true');
}

/**
 * Show the result screen (randomly chosen)
 * @param {Element} block root block element
 * @param {Object} data quiz data
 */
async function showResult(block, data) {
  // randomize order, pick first
  const shuffled = shuffleArray(data.results);
  const chosen = shuffled[0];

  // clear block and render result
  block.textContent = '';

  const wrapper = createEl('div', { class: 'quiz-wrapper' });
  const resultArea = createEl('div', { class: 'quiz-result' });

  const title = createEl('div', { class: 'quiz-result-title', text: `You got — ${chosen.title}` });
  const desc = createEl('p', { class: 'quiz-result-desc', text: chosen.desc });

  // Picture: attempt to use createOptimizedPicture, but fallback to plain image
  let imgContainer;
  try {
    // eslint-disable-next-line prefer-destructuring
    const picture = createOptimizedPicture(chosen.img, chosen.title, false, [{ width: '400' }]);
    imgContainer = createEl('div', { class: 'quiz-result-image' }, [picture]);
  } catch (e) {
    const img = createEl('img', { src: chosen.img, alt: chosen.title, class: 'quiz-result-image' });
    imgContainer = createEl('div', {}, [img]);
  }

  const retake = createEl('button', {
    class: 'quiz-retake',
    type: 'button',
    text: 'RETAKE TEST',
    'aria-label': 'Retake the quiz',
  });

  retake.addEventListener('click', async () => {
    // re-run decorate to reset the quiz
    await decorate(block);
    retake.blur();
  });

  resultArea.appendChild(title);
  resultArea.appendChild(imgContainer);
  resultArea.appendChild(desc);
  resultArea.appendChild(retake);

  // center the result area (single column)
  wrapper.appendChild(resultArea);
  block.appendChild(wrapper);
}

/**
 * Main exported decorate function
 * @param {Element} block block DOM element injected by EDS
 */
export default async function decorate(block) {
  // Get data
  const data = getQuizData();

  // Build DOM
  const refs = buildQuizDom(block, data);

  // State
  const state = {
    answers: {},
    current: 0,
    total: data.questions.length,
  };

  // Render first question
  renderQuestion(refs, data.questions[state.current], state.current, state);

  // Next button handler
  refs.nextBtn.addEventListener('click', async () => {
    // prevent if disabled
    if (refs.nextBtn.hasAttribute('disabled')) return;

    // Move to next or show result
    state.current += 1;

    if (state.current >= state.total) {
      // show result (random)
      await showResult(block, data);
      return;
    }

    // render next question
    renderQuestion(refs, data.questions[state.current], state.current, state);

    // disable next until choose
    refs.nextBtn.setAttribute('disabled', 'true');
  });

  // Accessibility: allow keyboard Enter on focused option to select
  refs.optionsEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      const target = ev.target;
      if (target && target.classList && target.classList.contains('quiz-option')) {
        target.click();
        ev.preventDefault();
      }
    }
  });

  // slight async pause to allow focus management if block was just inserted
  await new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}
