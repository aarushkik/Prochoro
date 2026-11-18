import { buildExamBank, item as m, code, table, type Family, type Pattern } from './buildExamBank';
import type { Stimulus } from '@/types';

/**
 * AP Computer Science Principles: original practice written to the public
 * course framework's five big ideas and its exam reference sheet.
 *
 * Code uses the exam's own pseudocode: ← assigns, lists start at index 1,
 * DISPLAY prints a value followed by a space, and / is ordinary division.
 * Every computed answer below is produced by the same arithmetic it asks
 * about, so a changed number can never leave a stale answer behind.
 */

interface Scene { q: string; a: string | number; w: (string | number)[]; why: string; s?: Stimulus }
/** Up to three different problems on one skill. A repeat is dropped by the bank builder. */
const scenes = (skill: string, pattern: Pattern, list: Scene[]): Family => v => {
  const x = list[v % list.length];
  return m(skill, pattern, x.q, x.a, x.w, x.why, x.s);
};
const listText = (values: (string | number)[]) => '[' + values.map(value => typeof value === 'string' ? '"' + value + '"' : value).join(', ') + ']';

const areas: Family[][] = [
  [ // Big Idea 1: Creative Development
    scenes('Collaboration', 'Concept application', [
      { q: 'A team designing a recycling app interviews students from several schools before choosing features. What is the main benefit of this step?', a: 'Different perspectives help the team find user needs it might otherwise miss', w: ['Interviews reduce the amount of code the team must write', 'User interviews replace the need to test the program', 'Feedback is only useful after the program is complete'], why: 'Gathering input from varied users during design exposes needs and problems the developers may not anticipate. It informs the design; it does not replace testing or reduce code by itself.' },
      { q: 'Two students share one computer. One writes code while the other reviews each line, and they switch roles every 20 minutes. What is the main benefit of this practice?', a: 'Errors and design problems are more likely to be caught while the code is written', w: ['The program runs faster because two people wrote it', 'Each student only needs to understand half of the program', 'The finished program no longer needs to be tested'], why: 'Pair programming puts a second person on every line as it is written, which helps catch mistakes early. It affects how code is developed, not how fast the finished program runs.' },
      { q: 'Two developers in different countries edit the same program. Which practice best helps them avoid overwriting each other’s changes?', a: 'Using version control so changes can be tracked, compared and merged', w: ['Writing their halves in two different programming languages', 'Waiting until the program is finished before sharing any code', 'Removing comments so the files are smaller'], why: 'Version control records each change and helps combine work from several people. Sharing early and often, with history, is what makes distributed collaboration practical.' },
    ]),
    scenes('Program purpose and behavior', 'Concept application', [
      { q: 'In a game, the procedure updateScore runs every time the player taps a button. Which programming idea does this describe?', a: 'Event-driven programming, where code runs in response to an action', w: ['Sequential programming, where each statement runs once in a fixed order', 'Iteration, where a block repeats a set number of times', 'Data compression, where repeated values are stored once'], why: 'An event, such as a tap, triggers the code. Event-driven programs wait for actions rather than running straight through once from top to bottom.' },
      { q: 'A program reads a temperature from a sensor every minute and shows a warning when a reading is above 35°C. Which of these is an input to the program?', a: 'The temperature readings from the sensor', w: ['The warning shown on the screen', 'The value 35 written in the program', 'The one-minute schedule for checking the sensor'], why: 'Inputs are data the program receives from outside, here the sensor readings. The warning is output, and 35 is a constant written into the code.' },
      { q: 'Why do programmers write comments that explain what each procedure does?', a: 'Comments help people, including the original author later, understand and change the code', w: ['Comments make the program run more efficiently', 'Comments are required for a program to run', 'Comments are shown to users while the program runs'], why: 'Comments are documentation for people. They are ignored when the program runs, but they make code easier to maintain, debug and share.' },
    ]),
    scenes('Finding and fixing errors', 'Code analysis', [
      { q: 'The code segment is intended to assign the average of a, b and c to avg. Which best describes its error?', a: 'A logic error, because only c is divided by 3', w: ['A syntax error, because ← cannot be used with arithmetic', 'A run-time error, because division is not allowed in an assignment', 'An overflow error, because the sum is too large to store'], why: 'Division happens before addition, so the code computes a + b + (c / 3). The program runs but produces the wrong value; parentheses around a + b + c fix it.', s: code('avg ← a + b + c / 3') },
      { q: 'What happens when this code segment runs?', a: 'A run-time error occurs, because the list has no element at index 4', w: ['9 is displayed, because index 4 refers to the last element', '4 is displayed, because the list starts at index 0', 'A syntax error occurs before the program starts'], why: 'AP pseudocode lists start at index 1, so nums has valid indices 1, 2 and 3. Accessing index 4 is an error that only appears when the program runs.', s: code('nums ← [4, 7, 9]\nDISPLAY(nums[4])') },
      { q: 'The code segment is intended to display 1 2 3 4 5. Which change makes it work as intended?', a: 'Initialize count to 1 instead of 0', w: ['Change REPEAT 5 TIMES to REPEAT 6 TIMES', 'Move DISPLAY(count) after the end of the loop', 'Change count ← count + 1 to count ← count + 2'], why: 'As written the loop displays 0 1 2 3 4. Starting count at 1 shifts every displayed value up by one while keeping five repetitions.', s: code('count ← 0\nREPEAT 5 TIMES\n{\n  DISPLAY(count)\n  count ← count + 1\n}') },
    ]),
    scenes('Testing with boundary values', 'Code analysis', [
      { q: 'isTeen(age) should return true when age is from 13 to 19, inclusive. Which set of test values best checks the boundaries?', a: '12, 13, 19, 20', w: ['1, 5, 10, 15', '13, 14, 15, 16', '20, 30, 40, 50'], why: 'Boundary testing checks values just inside and just outside each edge. Errors such as using < instead of ≤ show up only at those values.' },
      { q: 'A program should take 10% off when total is at least 50. The programmer wrote IF(total > 50). Which test would reveal the error?', a: 'total = 50', w: ['total = 49', 'total = 100', 'total = 0'], why: 'At exactly 50 the discount should apply, but total > 50 is false. Values away from the boundary behave the same under both conditions.' },
      { q: 'A program accepts quiz scores from 0 to 100. Which test input checks how it handles a value outside the valid range?', a: '101', w: ['0', '60', '100'], why: '0 and 100 are valid boundary values and 60 is an ordinary value. 101 is just outside the range, so it tests whether invalid input is rejected.' },
    ]),
  ],
  [ // Big Idea 2: Data — representation and compression
    v => {
      const bits = ['1011', '11010', '100111'][v]; const value = parseInt(bits, 2);
      const reversed = parseInt([...bits].reverse().join(''), 2);
      return m('Binary numbers', 'Mathematical reasoning', 'What is the decimal value of the binary number ' + bits + '?', value, [value * 2, reversed, value + 1], 'Each place is worth a power of 2, starting with 1 on the right. Adding the place values that contain a 1 gives ' + value + '.');
    },
    v => {
      const n = [5, 7, 10][v]; const count = 2 ** n;
      return m('Bits and possible values', 'Mathematical reasoning', 'A sensor stores each reading using ' + n + ' bits. How many different values can it represent?', count, [2 * n, n * n, count - 1], 'Each bit doubles the number of patterns, so n bits give 2^n = ' + count + ' different values. The largest unsigned value is ' + (count - 1) + ', but zero is also a value.');
    },
    scenes('Overflow and round-off', 'Concept application', [
      { q: 'A program stores whole numbers using a fixed number of bits. Adding 1 to the largest value it can store produces an unexpected result. Which kind of error is this?', a: 'An overflow error', w: ['A round-off error', 'A syntax error', 'A lossy compression error'], why: 'When a result needs more bits than are available, the extra information is lost. That is overflow; round-off affects how real numbers are approximated.' },
      { q: 'A program displays 0.30000000000000004 for 0.1 + 0.2. Which explanation is best?', a: 'Round-off error, because some decimal values can only be approximated in binary', w: ['Overflow error, because the sum is larger than the largest storable number', 'A logic error in the + operator', 'Lossless compression of the result'], why: 'Values such as 0.1 have no exact finite binary form, so they are stored as close approximations. The tiny difference appears when the result is displayed.' },
      { q: 'A 3-bit counter stores whole numbers from 0 to 7. It holds 6 (110), and then 3 is added. It now shows 1. Why?', a: 'The true sum, 9, needs four bits, so only the lowest three bits (001) are kept', w: ['9 is approximated by the nearest value the counter can store', 'The counter reads binary from right to left', 'The counter stores numbers in base 10'], why: '9 in binary is 1001. With room for three bits, the leading 1 is lost and 001 remains. This overflow is why the counter shows 1.' },
    ]),
    scenes('Data compression', 'Concept application', [
      { q: 'A photographer must be able to restore the exact original image after compressing it. Which approach fits?', a: 'Lossless compression', w: ['Lossy compression, because it usually produces smaller files', 'Lossy compression, because lost details can be restored later', 'Converting the image to text before compressing'], why: 'Lossless compression lets the original data be rebuilt exactly. Lossy methods discard some data permanently in exchange for smaller files.' },
      { q: 'A streaming service wants the smallest possible video files, and some loss of fine detail is acceptable. Which approach fits?', a: 'Lossy compression', w: ['Lossless compression, because it produces smaller files than lossy methods', 'Lossless compression, because discarded detail is restored during playback', 'Storing each frame uncompressed'], why: 'Lossy compression usually reduces size much more than lossless compression by removing detail viewers are unlikely to notice. The removed data cannot be recovered.' },
      { q: 'The text AAAABBBCCD is compressed as 4A3B2C1D. Which statement is true?', a: 'The method is lossless, because the original text can be rebuilt exactly', w: ['The method is lossy, because repeated letters were removed', 'This method makes every string shorter', 'The order of the letters cannot be recovered'], why: 'Each count and letter rebuilds the original run, so nothing is lost. Run-length encoding can make text longer when there are few repeats; ABCD becomes 1A1B1C1D.' },
    ]),
  ],
  [ // Big Idea 2: Data — extracting information
    scenes('Metadata', 'Concept application', [
      { q: 'A phone saves each photo with the date, time and location it was taken. What are these details called?', a: 'Metadata', w: ['Pixel data', 'Lossy compression', 'An overflow error'], why: 'Metadata is data about data. The date and location describe the photo; the pixels are the photo’s content.' },
      { q: 'How does metadata help someone search a large music library?', a: 'Artist, album and genre tags let songs be sorted and filtered without analyzing the audio', w: ['Metadata changes the sound of each song to match its genre', 'Metadata is the audio itself, stored in a smaller format', 'Removing metadata makes songs easier to find'], why: 'Tags describe each file, so a program can search and organize files quickly using those descriptions instead of processing the audio.' },
      { q: 'Before sharing photos online, a student removes their location metadata. What is the result?', a: 'The photos look the same, but where they were taken is no longer attached', w: ['The photos lose resolution', 'The photos can no longer be opened', 'The photos become encrypted'], why: 'Removing metadata does not change the image content. It removes descriptive information, such as location, that could reveal personal details.' },
    ]),
    scenes('Cleaning data', 'Data analysis', [
      { q: 'A survey asked students for their home state. Before counting responses by state, what should be done with entries like these?', a: 'Clean the data so each state is written in one consistent form', w: ['Delete every response that uses an abbreviation', 'Count each spelling as a separate state', 'Sort the responses alphabetically'], why: 'Inconsistent entries for the same value would be counted separately. Standardizing them is data cleaning; deleting valid responses would lose information.', s: table('Response\nNY\nNew York\nnew york\nCA\nCalifornia') },
      { q: 'A data set of student ages includes the values 15, 16, -3, 17 and 250. What should happen before the ages are averaged?', a: 'Find and correct or remove the impossible values', w: ['Keep them, since more data makes any average more accurate', 'Replace every age with the overall average', 'Convert the ages to text so they sort correctly'], why: 'Invalid entries such as -3 and 250 would distort the average. Cleaning means checking such values, correcting them when possible and otherwise excluding them.' },
      { q: 'Some students submitted the same survey twice. What is the best cleaning step before analyzing results?', a: 'Remove duplicate submissions so each student is counted once', w: ['Double the count for every student who submitted once', 'Delete all of those students’ responses', 'Keep the duplicates, because they show stronger opinions'], why: 'Duplicate records give some people extra weight. Removing duplicates keeps each respondent represented once without losing their data.' },
    ]),
    v => {
      const sets = [
        { label: 'Screen time (hours) | Sleep (hours)', rows: [[1, 8.5], [2, 8.1], [3, 7.6], [4, 7.0], [5, 6.6]], a: 'More screen time is associated with less sleep in this data set', cause: 'Screen time causes students to sleep less', none: 'Sleep and screen time show no relationship', every: 'Every student who uses screens sleeps less than 7 hours' },
        { label: 'Practice (hours) | Score', rows: [[1, 62], [2, 66], [4, 74], [5, 79], [7, 86]], a: 'More practice is associated with higher scores in this data set', cause: 'Practice causes the scores to rise by the same amount for everyone', none: 'Practice and score show no relationship', every: 'Every student who practiced more than 4 hours scored above 90' },
        { label: 'Temperature (°C) | Heating cost ($)', rows: [[2, 140], [6, 118], [10, 95], [14, 71], [18, 52]], a: 'Higher temperatures are associated with lower heating costs in this data set', cause: 'Lower heating costs cause warmer temperatures', none: 'Temperature and heating cost show no relationship', every: 'Heating cost will reach $0 at 20°C' },
      ][v];
      return m('Correlation and causation', 'Data analysis', 'Which conclusion is best supported by the data?', sets.a, [sets.cause, sets.none, sets.every], 'The values move together, which shows an association. The data were observed, not produced by an experiment, so they do not show cause and effect or support claims beyond the data.', table(sets.label + '\n' + sets.rows.map(row => row.join(' | ')).join('\n')));
    },
    scenes('Limits and bias in data', 'Concept application', [
      { q: 'A survey about home internet access is posted only on a website. What is the main problem with its results?', a: 'People without internet access are less likely to respond, so access may be overstated', w: ['The sample is large, so the results apply to everyone', 'Online surveys can only collect numbers', 'The survey is biased only if its questions are long'], why: 'How data is collected affects who is included. Here the group the question is about is the group least able to answer, which biases the results.' },
      { q: 'A program finds that most top-rated restaurants are downtown. The ratings come from a review site used mostly by tourists. Which limitation matters most?', a: 'The ratings may reflect tourists’ preferences more than residents’', w: ['Restaurant ratings cannot be analyzed by a program', 'Downtown restaurants must be better than others', 'Large data sets do not contain bias'], why: 'Conclusions only describe the people who produced the data. A data set from one group may not represent everyone the conclusion is about.' },
      { q: 'A data set grows from thousands of rows to billions. What is most likely needed to analyze it in a reasonable time?', a: 'Parallel or distributed processing across many processors', w: ['Deleting most rows so it fits on one laptop', 'Converting every value to text', 'Applying lossy compression to the numbers first'], why: 'Very large data sets often exceed what one computer can process quickly. Splitting the work across processors makes the analysis practical without discarding data.' },
    ]),
  ],
  [ // Big Idea 3: Algorithms and Programming — variables and expressions
    v => {
      const n = [2, 3, 4][v]; const b = n + 2; const a = b * 3;
      return m('Variables and assignment', 'Code analysis', 'What is displayed when the code segment runs?', a, [n * 3, b, 3 * n + 2], 'Assignments run in order. b gets ' + b + ', and a is then replaced by b * 3 = ' + a + '. The first value of a is no longer used.', code('a ← ' + n + '\nb ← a + 2\na ← b * 3\nDISPLAY(a)'));
    },
    v => {
      const [p, q] = [[5, 8], [3, 9], [2, 7]][v];
      return m('Assignment order', 'Code analysis', 'What is displayed when the code segment runs?', q + ' ' + q, [q + ' ' + p, p + ' ' + q, p + ' ' + p], 'After x ← y, both variables hold ' + q + ', and the original value of x is lost. Swapping two values requires a temporary variable.', code('x ← ' + p + '\ny ← ' + q + '\nx ← y\ny ← x\nDISPLAY(x)\nDISPLAY(y)'));
    },
    v => {
      const n = [47, 63, 85][v]; const ones = n % 10; const tenths = (n / 10).toFixed(1);
      return m('MOD and division', 'Mathematical reasoning', 'What is displayed when the code segment runs?', ones + ' ' + tenths, [ones + ' ' + Math.floor(n / 10), Math.floor(n / 10) + ' ' + ones, tenths + ' ' + ones], 'n MOD 10 is the remainder after dividing by 10, ' + ones + '. In AP pseudocode, / is ordinary division, so n / 10 is ' + tenths + ', not a whole number.', code('n ← ' + n + '\nDISPLAY(n MOD 10)\nDISPLAY(n / 10)'));
    },
    v => {
      const [temp, raining] = [[25, false], [25, true], [18, false]][v] as [number, boolean];
      const answer = temp > 20 && !raining ? 'walk' : 'bus';
      return m('Boolean expressions', 'Code analysis', 'What is displayed when the code segment runs?', answer, ['walk', 'bus', 'walk bus', 'Nothing is displayed'].filter(value => value !== answer), 'AND is true only when both conditions are true: temp > 20 and NOT raining. Here the condition is ' + (answer === 'walk') + ', so the ' + (answer === 'walk' ? 'IF' : 'ELSE') + ' block runs.', code('temp ← ' + temp + '\nraining ← ' + raining + '\nIF(temp > 20 AND NOT raining)\n{\n  DISPLAY("walk")\n}\nELSE\n{\n  DISPLAY("bus")\n}'));
    },
  ],
  [ // Big Idea 3: Algorithms and Programming — selection and iteration
    v => {
      const score = [92, 85, 79][v]; const answer = score >= 90 ? 'A' : score >= 80 ? 'B' : 'C';
      return m('Nested conditionals', 'Code analysis', 'What is displayed when the code segment runs?', answer, ['A', 'B', 'C', 'A B'].filter(value => value !== answer), 'Only one branch runs. The outer IF checks score ≥ 90; if that is false, the inner IF checks score ≥ 80; otherwise C is displayed.', code('score ← ' + score + '\nIF(score ≥ 90)\n{\n  DISPLAY("A")\n}\nELSE\n{\n  IF(score ≥ 80)\n  {\n    DISPLAY("B")\n  }\n  ELSE\n  {\n    DISPLAY("C")\n  }\n}'));
    },
    v => {
      const n = [3, 4, 5][v]; let total = 0; let x = 1;
      for (let i = 0; i < n; i += 1) { total += x; x *= 2; }
      return m('REPEAT n TIMES', 'Code analysis', 'What is displayed when the code segment runs?', total, [2 ** n, 2 ** (n - 1), 2 * n - 1], 'x takes the values 1, 2, 4, … and each is added to total once. After ' + n + ' repetitions total is ' + total + ', one less than the next power of 2.', code('total ← 0\nx ← 1\nREPEAT ' + n + ' TIMES\n{\n  total ← total + x\n  x ← x * 2\n}\nDISPLAY(total)'));
    },
    v => {
      const start = [3, 5, 7][v]; let n = start; let count = 0;
      while (!(n > 50)) { n *= 2; count += 1; }
      return m('REPEAT UNTIL', 'Code analysis', 'What is displayed when the code segment runs?', count, [count - 1, count + 1, n], 'The condition is checked before each pass, and the loop stops once n > 50. n doubles to ' + n + ' after ' + count + ' passes, so count is ' + count + '.', code('n ← ' + start + '\ncount ← 0\nREPEAT UNTIL(n > 50)\n{\n  n ← n * 2\n  count ← count + 1\n}\nDISPLAY(count)'));
    },
    v => {
      const [start, step] = [[1, 2], [2, 2], [0, 3]][v]; let i = start; let runs = 0;
      while (i !== 10 && runs < 100) { i += step; runs += 1; }
      const answer = runs >= 100 ? 'The loop never terminates' : 'The loop body runs ' + runs + ' times';
      return m('Infinite loops', 'Code analysis', 'Which statement about the code segment is true?', answer, ['The loop never terminates', 'The loop body runs 4 times', 'The loop body runs 5 times', 'The loop body does not run at all'].filter(value => value !== answer), 'The loop stops only when i equals 10 exactly. Starting at ' + start + ' and adding ' + step + ' each time, i ' + (runs >= 100 ? 'skips over 10, so the condition is never true' : 'reaches 10 after ' + runs + ' passes') + '.', code('i ← ' + start + '\nREPEAT UNTIL(i = 10)\n{\n  i ← i + ' + step + '\n}'));
    },
  ],
  [ // Big Idea 3: Algorithms and Programming — lists and procedures
    v => {
      const words = ['sun', 'moon', 'star', 'comet'];
      const cases = [
        { lines: 'DISPLAY(words[2])', a: 'moon', w: ['star', 'sun', 'An error, because list indices start at 0'], why: 'Lists in AP pseudocode start at index 1, so words[2] is the second element, "moon".' },
        { lines: 'DISPLAY(words[LENGTH(words)])', a: 'comet', w: ['star', '4', 'An error, because index 4 is past the end of the list'], why: 'LENGTH(words) is 4, and because indices start at 1, index 4 is the last element, "comet".' },
        { lines: 'INSERT(words, 1, "planet")\nDISPLAY(words[2])', a: 'sun', w: ['planet', 'moon', 'comet'], why: 'INSERT puts "planet" at index 1 and shifts every other element one place right, so "sun" moves to index 2.' },
      ][v];
      return m('List indexing', 'Code analysis', 'What is displayed when the code segment runs?', cases.a, cases.w, cases.why, code('words ← ' + listText(words) + '\n' + cases.lines));
    },
    v => {
      const start = [[5, 8, 2], [3, 6, 1, 4], [7, 2]][v]; const [add, ins] = [[6, 9], [5, 8], [4, 1]][v];
      const run = (oneBased: boolean, insertReplaces: boolean) => {
        const list = [...start, add]; list.splice(oneBased ? 0 : 1, 1);
        const at = oneBased ? 1 : 2; if (insertReplaces) list[at] = ins; else list.splice(at, 0, ins);
        return listText(list);
      };
      return m('List operations', 'Code analysis', 'What is displayed when the code segment runs?', run(true, false), [run(false, false), run(true, true), listText([ins, ...start.slice(1), add])], 'APPEND adds ' + add + ' to the end. REMOVE(nums, 1) deletes the first element. INSERT(nums, 2, ' + ins + ') places ' + ins + ' at index 2 and shifts later elements right.', code('nums ← ' + listText(start) + '\nAPPEND(nums, ' + add + ')\nREMOVE(nums, 1)\nINSERT(nums, 2, ' + ins + ')\nDISPLAY(nums)'));
    },
    v => {
      const scores = [[70, 85, 64, 70, 91], [55, 70, 72, 69, 80, 70, 40], [70, 95, 60, 70, 70, 20]][v];
      const atLeast = scores.filter(value => value >= 70).length;
      return m('Traversing a list', 'Code analysis', 'What is displayed when the code segment runs?', atLeast, [scores.filter(value => value > 70).length, scores.length, scores.filter(value => value < 70).length], 'FOR EACH visits every element once. Only values greater than or equal to 70 increase count, so scores equal to 70 are included: ' + atLeast + ' in total.', code('scores ← ' + listText(scores) + '\ncount ← 0\nFOR EACH item IN scores\n{\n  IF(item ≥ 70)\n  {\n    count ← count + 1\n  }\n}\nDISPLAY(count)'));
    },
    v => {
      const n = [6, 5, 7][v]; const f = (x: number) => (x % 2 === 0 ? x / 2 : 3 * x + 1);
      return m('Procedures and return values', 'Code analysis', 'What is displayed when the code segment runs?', f(f(n)), [f(n), n, f(f(f(n)))], 'The inner call runs first: f(' + n + ') returns ' + f(n) + '. That value is passed to the outer call, which returns ' + f(f(n)) + '.', code('PROCEDURE f(x)\n{\n  IF(x MOD 2 = 0)\n  {\n    RETURN(x / 2)\n  }\n  RETURN(3 * x + 1)\n}\nDISPLAY(f(f(' + n + ')))'));
    },
  ],
  [ // Big Idea 3: Algorithms and Programming — algorithms
    v => {
      const n = [16, 100, 1000][v]; const worst = Math.floor(Math.log2(n)) + 1;
      return m('Binary search', 'Mathematical reasoning', 'A sorted list contains ' + n + ' values. What is the greatest number of values a binary search must examine to find a target or decide it is missing?', worst, [n / 2, worst - 1, n], 'Each comparison halves the part of the list still being searched. ' + n + ' values can be halved ' + (worst - 1) + ' times before one remains, so at most ' + worst + ' values are examined.');
    },
    scenes('Choosing a search', 'Concept application', [
      { q: 'Which condition must be true for a binary search to work correctly?', a: 'The list must be sorted', w: ['The list must have an even number of elements', 'The list must contain only numbers', 'The target must be in the list'], why: 'Binary search discards half the list after each comparison, which only works when the order tells it which half cannot contain the target.' },
      { q: 'An unsorted list of 1,000,000 values will be searched once. Which approach is most reasonable?', a: 'A linear search, because sorting first takes longer than one search', w: ['A binary search, without sorting first', 'A binary search, because it works on any list', 'No search, because an unsorted list cannot be searched'], why: 'Binary search needs sorted data, and sorting a million values costs more than one pass through them. For a single search, checking each value is simpler and faster.' },
      { q: 'A sorted list is searched thousands of times a day, and it keeps growing. Why is binary search preferred?', a: 'It examines far fewer values per search as the list grows', w: ['It finds every copy of the target at once', 'It needs no comparisons at all', 'It only works on lists with fewer than 1,000 values'], why: 'Doubling the list adds only one step to a binary search but doubles the worst case of a linear search. The advantage grows with the list.' },
    ]),
    scenes('Reasonable time and heuristics', 'Concept application', [
      { q: 'The number of steps an algorithm takes doubles each time one value is added to its input. Which statement is correct?', a: 'It does not run in a reasonable time for large inputs', w: ['It runs in a reasonable time because each step is simple', 'It runs in polynomial time because n is an exponent', 'Doubling the steps means it finishes twice as fast'], why: 'Steps that double with each added value grow exponentially (2^n). Exponential algorithms become impractical quickly, so they are not considered reasonable time.' },
      { q: 'For an input of size n, an algorithm makes n × n comparisons. How is its running time classified?', a: 'Polynomial time, which is considered reasonable', w: ['Exponential time, which is unreasonable', 'Constant time, because the work does not depend on n', 'Unreasonable, because it uses nested loops'], why: 'n × n is n², a polynomial. Algorithms that run in polynomial time are considered reasonable even though they slow down as n grows.' },
      { q: 'A delivery company must plan a route through 500 stops. Checking every possible route would take far too long. What is the best approach?', a: 'Use a heuristic that finds a good route, even if it might not be the best one', w: ['Check every route on a faster computer', 'Pick one route at random and stop', 'Plan routes for only the first 10 stops'], why: 'When finding the exact best answer takes unreasonable time, a heuristic gives an approximate solution that is good enough in practice.' },
    ]),
    scenes('Randomness and undecidable problems', 'Concept application', [
      { q: 'Which values can roll have after this code segment runs?', a: '1, 2, 3, 4, 5 or 6', w: ['0 through 6', '1 through 5', '0 through 5'], why: 'RANDOM(a, b) returns a random whole number from a to b, including both endpoints. Each of 1 through 6 is equally likely.', s: code('roll ← RANDOM(1, 6)') },
      { q: 'A city uses a computer simulation to test a new traffic-light pattern before installing it. What is the main benefit?', a: 'Changes can be tested safely and cheaply before real-world use', w: ['The results will exactly match real traffic', 'The simulation removes the need for any real traffic data', 'A simulation can only be run once'], why: 'Simulations let people explore changes without real-world cost or risk. They rely on simplifying assumptions, so results are estimates rather than guarantees.' },
      { q: 'Which statement about an undecidable problem is true?', a: 'No single algorithm gives a correct yes-or-no answer for every input, though some inputs can be solved', w: ['No input of the problem can be solved by any algorithm', 'The problem can be solved by a fast enough computer', 'The problem becomes decidable when a heuristic is used'], why: 'Undecidable means no algorithm can always decide correctly. Speed does not help, and a heuristic gives approximations, not a guaranteed correct answer for every case.' },
    ]),
  ],
  [ // Big Idea 4: Computer Systems and Networks
    scenes('Packets and fault tolerance', 'Concept application', [
      { q: 'A file is sent across the Internet in packets. Which statement is true?', a: 'Packets may take different paths and arrive out of order, then be reassembled', w: ['Packets must travel in order along one fixed path', 'The whole file must travel as a single packet', 'Packets that arrive out of order are discarded'], why: 'Routers send each packet along whatever path is available. The receiving computer uses information in the packets to put the data back in order.' },
      { q: 'Why is the Internet described as fault tolerant?', a: 'Redundant paths let data be rerouted when a connection fails', w: ['Every device stores a backup copy of the whole Internet', 'Routers check every packet for viruses', 'Every message is sent twice to every device'], why: 'Fault tolerance comes from redundancy: there are many possible routes. If one link or router fails, traffic can use another path.' },
      { q: 'The table lists every direct connection in a small network. If the connection between B and D fails, can A still send data to D?', a: 'Yes, through C', w: ['No, because B was on the only path', 'Only if A connects directly to D', 'Only after the failed connection is repaired'], why: 'A is connected to C, and C is connected to D. That second route is redundancy, which keeps the network working when one connection fails.', s: table('Connection\nA – B\nA – C\nB – D\nC – D\nB – C') },
    ]),
    scenes('Protocols', 'Concept application', [
      { q: 'What is a protocol in computing?', a: 'An agreed-upon set of rules for how devices send and receive data', w: ['A physical cable that connects two computers', 'A program that blocks malware', 'The fastest route between two routers'], why: 'Protocols let devices made by different companies communicate, because each follows the same rules for formatting and exchanging data.' },
      { q: 'Which protocol is mainly responsible for addressing packets so they can be routed to their destination?', a: 'IP', w: ['HTTP', 'TCP', 'UDP'], why: 'The Internet Protocol (IP) gives devices addresses and routes packets toward them. TCP and UDP sit above IP, and HTTP is used by web browsers and servers.' },
      { q: 'A video-call app would rather lose an occasional packet than wait for it to be sent again. Which protocol fits best?', a: 'UDP, because it does not wait to resend lost packets', w: ['TCP, because it sends packets faster than UDP', 'HTTP, because video must be loaded as a web page', 'IP, because it resends any lost packets'], why: 'TCP guarantees delivery by resending lost packets, which adds delay. UDP skips that, which suits live audio and video where a late packet is useless.' },
    ]),
    v => {
      const tasks = [[40, 30, 20, 10], [50, 30, 20, 20], [60, 20, 20, 20]][v];
      const total = tasks.reduce((sum, value) => sum + value, 0);
      let best = total;
      for (let mask = 0; mask < 1 << tasks.length; mask += 1) {
        const one = tasks.reduce((sum, value, index) => sum + (mask & (1 << index) ? value : 0), 0);
        best = Math.min(best, Math.max(one, total - one));
      }
      return m('Parallel computing', 'Mathematical reasoning', 'Four independent tasks take ' + tasks.join(', ') + ' seconds on one processor. With two processors, each running whole tasks, what is the shortest time to finish all four?', best + ' seconds', [total + ' seconds', total / 2 === best ? total / 4 + ' seconds' : total / 2 + ' seconds', tasks[0] + tasks[1] + ' seconds'], 'Running in sequence takes ' + total + ' seconds. In parallel, the finish time is set by the busier processor, so tasks are split to balance the load; the best split takes ' + best + ' seconds.');
    },
    scenes('Distributed systems and scale', 'Concept application', [
      { q: 'Why might researchers use distributed computing to analyze a huge data set?', a: 'Many computers can each process part of the data, solving problems too large for one machine', w: ['It makes each computer’s processor faster', 'It reduces the amount of data to be analyzed', 'It prevents errors from occurring'], why: 'Distributed computing spreads work across several networked computers. Each does part of the job, so larger problems can be handled in less time.' },
      { q: 'Why was IPv6 introduced to replace IPv4?', a: 'IPv4 does not provide enough addresses for the growing number of devices', w: ['IPv4 was too slow to carry video', 'IPv6 encrypts all Internet traffic', 'IPv6 removes the need for routers'], why: 'IPv4 addresses have 32 bits, about 4.3 billion addresses. IPv6 uses 128 bits, enough for vastly more devices.' },
      { q: 'The Internet was designed to be scalable. What does that mean?', a: 'It can grow to handle more devices and traffic without being redesigned', w: ['Every device must use the same hardware', 'It can only connect devices on one continent', 'Its speed stays the same no matter how much traffic it carries'], why: 'Open protocols and a hierarchy of networks let new devices and networks join without changing the whole system. That ability to grow is scalability.' },
    ]),
  ],
  [ // Big Idea 5: Impact of Computing — effects, access and bias
    scenes('Effects of computing innovations', 'Concept application', [
      { q: 'A social media app recommends posts each user is likely to engage with. Which is a possible harmful effect?', a: 'Users may mostly see views they already agree with', w: ['The app will run more slowly on older phones', 'Users will no longer be able to post', 'Recommendations will use less data'], why: 'Engagement-based recommendations can narrow what people see. An innovation designed for one purpose can have unintended social effects.' },
      { q: 'A farmer uses soil sensors to water crops only when the soil is dry. Which effect is most likely?', a: 'Less water is used while the crops still get what they need', w: ['Crops need more water because sensors use electricity', 'The farmer must water every field more often', 'The sensors replace the need for soil'], why: 'Data from sensors lets resources be used when and where they are needed. Efficiency is a common beneficial effect of computing innovations.' },
      { q: 'A navigation app sends drivers around traffic jams through quiet neighborhoods. Which outcome is an unintended effect?', a: 'More traffic on residential streets that were not designed for it', w: ['Drivers reach their destinations faster', 'The app collects location data to work', 'Highways have fewer cars during jams'], why: 'The intended benefit is faster trips. Heavier traffic on side streets is a side effect the designers did not aim for, which is what makes it unintended.' },
    ]),
    scenes('The digital divide', 'Concept application', [
      { q: 'A school moves all homework online. Which concern is an example of the digital divide?', a: 'Students without reliable internet at home may be unable to complete their work', w: ['Online homework is quicker to grade', 'Students may type faster than they write', 'Teachers may assign more homework'], why: 'The digital divide is unequal access to computing and the internet. A requirement that assumes access can disadvantage students who lack it.' },
      { q: 'Which action would most help reduce the digital divide?', a: 'Providing affordable internet access and devices in underserved areas', w: ['Offering a government service only through a mobile app', 'Raising broadband prices to pay for faster networks', 'Moving all public forms online only'], why: 'The divide narrows when more people can get and afford access. Moving services online only can widen it for people without access.' },
      { q: 'Which factor contributes most directly to the digital divide?', a: 'Differences in access related to income, location or infrastructure', w: ['Differences in typing speed', 'The number of social media apps available', 'Whether people prefer laptops or tablets'], why: 'The divide is driven by unequal access, often linked to income, rural or urban location, and available infrastructure, rather than personal preferences.' },
    ]),
    scenes('Bias in computing', 'Concept application', [
      { q: 'A hiring program is trained on a company’s past hiring data, and the company mostly hired men. What is the main risk?', a: 'The program may repeat the bias in the past data', w: ['The program cannot be biased because it uses math', 'The program will favor women to balance the data', 'Bias can only appear if a programmer intends it'], why: 'A model learns patterns from its training data, including unfair ones. Bias can enter through data even when no one intends it.' },
      { q: 'A face-recognition system is less accurate for some groups of people. What is the most likely cause?', a: 'The training data did not represent all groups equally', w: ['The cameras were too expensive', 'The algorithm processed the images too quickly', 'Face recognition is equally accurate for everyone'], why: 'When some groups are underrepresented in training data, the system has less to learn from for those groups, and its accuracy drops for them.' },
      { q: 'Which step best helps developers reduce bias in a machine learning model?', a: 'Test it on data from many different groups and adjust it based on the results', w: ['Train it on more data from the same original source', 'Keep the training data hidden from reviewers', 'Skip testing so the model can be released sooner'], why: 'Bias is found by checking how a model performs for different groups. Representative data and testing make it possible to detect and reduce it.' },
    ]),
    scenes('Crowdsourcing and citizen science', 'Concept application', [
      { q: 'A bird-watching app collects sightings from thousands of volunteers. What is the main benefit for researchers?', a: 'Data can come from far more places than researchers could visit themselves', w: ['Volunteers’ reports need no checking because there are many of them', 'Researchers no longer need to analyze the data', 'The data is private because many people contributed'], why: 'Crowdsourcing gathers contributions from many people. It widens coverage, but the data still needs checking because volunteers vary in skill.' },
      { q: 'An inventor raises money for a new product through many small online contributions. What is this called?', a: 'Crowdfunding', w: ['Phishing', 'Distributed computing', 'Data compression'], why: 'Crowdfunding uses the internet to collect small amounts of money from many people, one form of crowdsourcing.' },
      { q: 'Volunteers let their computers analyze radio-telescope data while they are idle. What does this combine?', a: 'Citizen science and distributed computing', w: ['Phishing and malware', 'Lossy compression and metadata', 'Multifactor authentication and encryption'], why: 'Members of the public contribute to research (citizen science), and the work is split across many computers (distributed computing).' },
    ]),
  ],
  [ // Big Idea 5: Impact of Computing — safe computing and legal use
    scenes('Personally identifiable information', 'Concept application', [
      { q: 'Which of these is personally identifiable information (PII)?', a: 'A student’s full name and home address', w: ['The average score on a class quiz', 'The number of students in a school', 'A list of popular first names'], why: 'PII is information that can identify a specific person. A name with an address points to one individual; averages and counts do not.' },
      { q: 'A fitness app stores each user’s location history. What is the main privacy risk?', a: 'Patterns in the data could reveal where a person lives or works', w: ['The app’s maps will load more slowly', 'The data makes the user’s phone run hot', 'Location data cannot be linked to a person'], why: 'Repeated locations, such as where someone is every night, can identify a person and their routine even without a name attached.' },
      { q: 'Why can combining several pieces of data that seem harmless be risky?', a: 'Together they can identify a specific person', w: ['Combining data makes each piece anonymous', 'Combined data cannot be shared', 'Each piece becomes less accurate'], why: 'Birth date, zip code and gender may each be common, but together they can narrow a group to one person. Aggregating data can reveal what single pieces do not.' },
    ]),
    v => {
      const answer = ['Phishing', 'Keylogging', 'A rogue access point'][v];
      return m('Online threats', 'Concept application', [
        'An email that looks like it is from a bank asks the user to “verify” a password through a link. What kind of attack is this?',
        'Hidden software records every key a user types in order to capture passwords. What is this called?',
        'An attacker sets up a free Wi-Fi network in a café to intercept the data people send. What is this called?',
      ][v], answer, ['Phishing', 'Keylogging', 'A rogue access point', 'A computer virus'].filter(value => value !== answer), [
        'Phishing tricks people into giving away personal information by pretending to be a trusted source. Checking the sender and not following unexpected links helps.',
        'Keylogging records keystrokes to steal what is typed, such as passwords. It is often installed by malware the user did not notice.',
        'A rogue access point is a wireless network an attacker controls. Data sent through it, if not encrypted, can be read or changed.',
      ][v]);
    },
    scenes('Encryption and authentication', 'Concept application', [
      { q: 'In public key encryption, which key does the sender use to encrypt a message for a receiver?', a: 'The receiver’s public key', w: ['The receiver’s private key', 'The sender’s private key', 'A password included in the same message'], why: 'Anyone can encrypt with the receiver’s public key, but only the receiver’s private key can decrypt it. The private key is never shared.' },
      { q: 'Each letter of a message is shifted three places: HELLO becomes KHOOR. What kind of encryption is this?', a: 'Symmetric encryption, because the same key (a shift of 3) encrypts and decrypts', w: ['Public key encryption', 'Lossless compression', 'Multifactor authentication'], why: 'In symmetric encryption one shared key does both jobs. Shifting forward by 3 encrypts, and shifting back by 3 decrypts.' },
      { q: 'A bank asks for a password and then a code sent to the user’s phone. Why is this more secure than a password alone?', a: 'An attacker would need both something the user knows and something the user has', w: ['The password is encrypted twice', 'Codes sent to phones cannot be intercepted', 'It removes the need for a strong password'], why: 'Multifactor authentication requires more than one kind of evidence. A stolen password alone is no longer enough to get in.' },
    ]),
    scenes('Legal and ethical use', 'Concept application', [
      { q: 'A student wants to use a photo published under a Creative Commons Attribution license. What must the student do?', a: 'Credit the creator in the way the license asks', w: ['Pay the creator before using it', 'Nothing, because Creative Commons means public domain', 'Ask the site to remove the license first'], why: 'Creative Commons licenses let creators share work with conditions. An Attribution license allows reuse as long as the creator is credited.' },
      { q: 'What does releasing a program as open source allow other people to do?', a: 'View, change and share its source code under the license’s terms', w: ['Sell it as their own work without any conditions', 'Use it only after paying a license fee', 'Run it without being allowed to see its code'], why: 'Open-source licenses publish the code and grant rights to study, modify and redistribute it, usually with conditions such as keeping the license.' },
      { q: 'A student finds a song online and uses all of it in a video posted for profit, without permission or a license. Which concern applies most?', a: 'It may violate the creator’s copyright', w: ['It is legal because the song was online', 'It is legal if the video is shorter than the song', 'Copyright only applies to printed books'], why: 'Material being available online does not make it free to use. Copyright protects the creator’s work unless a license or legal exception permits the use.' },
    ]),
  ],
];

export const computerSciencePrinciplesExamQuestions = buildExamBank('ap-csp', areas);
