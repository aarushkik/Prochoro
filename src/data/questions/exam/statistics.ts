import { buildExamBank, item as m, table, formula, type Family, type Pattern } from './buildExamBank';
import type { Stimulus } from '@/types';

/**
 * AP Statistics: original practice written to the public course framework's
 * nine units. Computed answers come from the arithmetic they describe, and the
 * wrong choices are the slips students actually make: a missing square root,
 * the reversed conditional, the residual with its sign flipped.
 */

interface Scene { q: string; a: string | number; w: (string | number)[]; why: string; s?: Stimulus }
const scenes = (skill: string, pattern: Pattern, list: Scene[]): Family => v => {
  const x = list[v % list.length];
  return m(skill, pattern, x.q, x.a, x.w, x.why, x.s);
};
/** Questions in the review area name their official unit explicitly. */
const u = (apUnit: number, family: Family): Family => v => ({ ...family(v), apUnit });
/** A number as statistics texts print it: a true minus sign, trailing zeros kept to `places`. */
const num = (value: number, places = 2) => (value < 0 ? '−' : '') + Math.abs(value).toFixed(places);
const short = (value: number) => (value < 0 ? '−' : '') + String(Math.round(Math.abs(value) * 1000) / 1000);

const areas: Family[][] = [
  [ // Unit 1: Exploring One-Variable Data
    v => {
      const data = [[8, 30, 3, 6, 5], [9, 2, 40, 7, 4], [13, 60, 10, 15, 12]][v];
      const sorted = [...data].sort((a, b) => a - b); const median = sorted[2];
      const mean = data.reduce((s, x) => s + x, 0) / 5; const trimmed = sorted.slice(0, 4).reduce((s, x) => s + x, 0) / 4;
      return m('Mean and median', 'Mathematical reasoning', 'What are the median and the mean of these five values?', 'Median ' + median + ', mean ' + short(mean), ['Median ' + short(mean) + ', mean ' + median, 'Median ' + data[2] + ', mean ' + short(mean), 'Median ' + median + ', mean ' + short(trimmed)], 'Order the values first; the median is the middle one, ' + median + '. The mean uses every value, including the large one, so it is pulled up to ' + short(mean) + '.', table('Values: ' + data.join(', ')));
    },
    scenes('Center and spread under changes', 'Concept application', [
      { q: 'Every student’s quiz score is increased by 5 points. How do the mean and the standard deviation change?', a: 'The mean increases by 5; the standard deviation stays the same', w: ['Both increase by 5', 'The standard deviation increases by 5; the mean stays the same', 'Neither changes'], why: 'Adding a constant shifts every value, and therefore the center, by that amount. The distances between values do not change, so the spread stays the same.' },
      { q: 'Every measurement in a data set is converted from meters to centimeters by multiplying by 100. How do the mean and the standard deviation change?', a: 'Both are multiplied by 100', w: ['Only the mean is multiplied by 100', 'Only the standard deviation is multiplied by 100', 'The mean is multiplied by 100 and the standard deviation by 10,000'], why: 'Multiplying every value by a positive constant scales both the center and the distances between values by that constant. Variance would be multiplied by 100².' },
      { q: 'Two classes have the same mean score. Class A’s scores range from 70 to 90; Class B’s range from 50 to 100. Which is most likely true?', a: 'Class B’s scores have the larger standard deviation', w: ['Class A’s scores have the larger standard deviation', 'The standard deviations must be equal because the means are equal', 'Standard deviations cannot be compared without the medians'], why: 'Standard deviation measures typical distance from the mean. Class B’s scores are spread over a much wider range, so they are likely farther from the mean on average.' },
    ]),
    v => {
      const [q1, q3] = [[20, 30], [12, 18], [40, 64]][v]; const iqr = q3 - q1; const fence = q3 + 1.5 * iqr;
      return m('Outliers and the IQR rule', 'Mathematical reasoning', 'A distribution has Q1 = ' + q1 + ' and Q3 = ' + q3 + '. Using the 1.5 × IQR rule, which values are outliers on the high side?', 'Values greater than ' + fence, ['Values greater than ' + q3, 'Values greater than ' + (q3 + iqr), 'Values greater than ' + (q3 + 3 * iqr)], 'IQR = Q3 − Q1 = ' + iqr + '. The upper fence is Q3 + 1.5 × IQR = ' + q3 + ' + ' + 1.5 * iqr + ' = ' + fence + '.');
    },
    v => {
      const [mean, sd, x] = [[70, 8, 82], [500, 100, 350], [64, 2.5, 69]][v]; const z = (x - mean) / sd;
      return m('z-scores', 'Mathematical reasoning', 'A distribution has mean ' + mean + ' and standard deviation ' + sd + '. What is the z-score of the value ' + x + '?', short(z), [short(x - mean), short(sd / (x - mean)), short(-z)], 'z = (value − mean) / standard deviation = (' + x + ' − ' + mean + ') / ' + sd + ' = ' + short(z) + '. It says how many standard deviations the value is from the mean, and in which direction.');
    },
  ],
  [ // Unit 2: Exploring Two-Variable Data
    scenes('Interpreting slope', 'Concept application', [
      { q: 'For used cars of one model, the least-squares line is predicted price = 12,000 − 950(age in years). What does the slope mean?', a: 'For each additional year of age, the predicted price decreases by $950', w: ['A new car of this model is predicted to cost $950', 'Every car of this model loses exactly $950 in value each year', 'The predicted price decreases by $12,000 each year'], why: 'The slope is the predicted change in the response for a one-unit increase in the explanatory variable. It describes the model’s prediction, not an exact change for each car.' },
      { q: 'For a class, the least-squares line is predicted score = 55 + 4.2(hours studied). What does the slope mean?', a: 'For each additional hour studied, the predicted score increases by 4.2 points', w: ['A student who does not study is predicted to score 4.2', 'Each hour of study causes a score to rise by exactly 4.2 points', 'The predicted score is 4.2 times the hours studied'], why: 'The slope gives the predicted change in score for each extra hour. The data are observational, so the line describes an association, not a guaranteed effect.' },
      { q: 'For children aged 2 to 10, the least-squares line is predicted height (cm) = 75 + 6.1(age in years). What does the y-intercept mean, and should it be trusted?', a: 'The predicted height at age 0 is 75 cm, but age 0 is outside the data, so it is an extrapolation', w: ['Every child grows 75 cm per year', 'The predicted height increases by 75 cm for each year of age', 'The intercept is the average height of the children in the study'], why: 'The intercept is the prediction when x = 0. Here x = 0 is outside the ages studied, so the value relies on extrapolation and may not be meaningful.' },
    ]),
    scenes('Correlation and r²', 'Concept application', [
      { q: 'Among elementary school students, r = 0.92 between shoe size and reading level. Which conclusion is best supported?', a: 'There is a strong positive association, but age likely influences both', w: ['Larger feet cause better reading', 'r = 0.92 means 92% of reading level is explained by shoe size', 'There is no real association because the variables are unrelated in meaning'], why: 'A strong correlation in observational data can come from a lurking variable. Older children tend to have both bigger feet and higher reading levels.' },
      { q: 'Which statement about the correlation coefficient r is true?', a: 'It measures the strength and direction of a linear relationship', w: ['r = 0 means there is no relationship of any kind', 'r changes when height is measured in centimeters instead of inches', 'A larger r means a steeper regression line'], why: 'r describes linear association only, so a strong curved pattern can have r near 0. It has no units and does not measure slope.' },
      { q: 'A regression predicting test score from hours of sleep has r² = 0.64. What does this mean?', a: 'About 64% of the variation in test scores is accounted for by the linear relationship with sleep', w: ['The correlation between sleep and score is 0.64', '64% of students’ scores are predicted exactly', 'Sleep causes 64% of each student’s score'], why: 'r² is the fraction of variation in the response explained by the linear model. The correlation itself would be the square root, 0.8, with the sign of the slope.' },
    ]),
    v => {
      const [a, b, x, y] = [[20, 3, 5, 38], [12, 2.5, 8, 29], [40, -1.5, 10, 22]][v]; const predicted = a + b * x; const residual = y - predicted;
      return m('Residuals', 'Mathematical reasoning', 'The least-squares line is ŷ = ' + a + (b < 0 ? ' − ' : ' + ') + Math.abs(b) + 'x. One observation is x = ' + x + ', y = ' + y + '. What is its residual?', short(residual), [short(-residual), short(predicted), short(y)], 'The predicted value is ' + a + (b < 0 ? ' − ' : ' + ') + Math.abs(b) + '(' + x + ') = ' + short(predicted) + '. Residual = observed − predicted = ' + y + ' − ' + short(predicted) + ' = ' + short(residual) + '.');
    },
    v => {
      const [[a, b], [c, d]] = [[[30, 20], [45, 15]], [[22, 28], [36, 14]], [[40, 10], [25, 25]]][v];
      const total = a + b + c + d;
      return m('Two-way tables', 'Data analysis', 'What proportion of 12th graders prefer online articles?', num(c / (c + d)), [num(c / total), num((a + c) / total), num(c / (a + c))], 'Condition on 12th graders only: ' + c + ' of the ' + (c + d) + ' 12th graders prefer online. Dividing by all students, or by all online readers, answers a different question.', table('Grade | Online | Print\n9th | ' + a + ' | ' + b + '\n12th | ' + c + ' | ' + d));
    },
  ],
  [ // Unit 3: Collecting Data
    v => {
      const answer = ['Stratified random sample', 'Cluster sample', 'Systematic random sample'][v];
      return m('Sampling methods', 'Concept application', [
        'A principal randomly selects 10 students from each grade level to survey. Which sampling method is this?',
        'A researcher randomly selects 5 homerooms and surveys every student in them. Which sampling method is this?',
        'A store picks a random number from 1 to 20, then surveys that customer and every 20th customer after. Which sampling method is this?',
      ][v], answer, ['Stratified random sample', 'Cluster sample', 'Systematic random sample', 'Simple random sample'].filter(value => value !== answer), [
        'Strata are groups expected to differ, here grade levels. A simple random sample is taken within each stratum, which guarantees every grade is represented.',
        'Clusters are naturally occurring groups. Randomly choosing whole clusters and surveying everyone in them is cluster sampling.',
        'Choosing a random start and then every kth individual is systematic sampling. It is easier than a simple random sample but can be biased if there is a pattern.',
      ][v]);
    },
    v => {
      const answer = ['Voluntary response bias', 'Undercoverage', 'Response bias from question wording'][v];
      return m('Sources of bias', 'Concept application', [
        'A radio station asks listeners to call in and say whether the city should build a new stadium. What is the main source of bias?',
        'A town estimates residents’ exercise habits by surveying a random sample of people leaving the town gym. What is the main source of bias?',
        'A survey asks, “Don’t you agree that the unfair parking fee should be removed?” What is the main source of bias?',
      ][v], answer, ['Voluntary response bias', 'Undercoverage', 'Response bias from question wording', 'Nonresponse bias'].filter(value => value !== answer), [
        'People choose whether to respond, and those with strong opinions are more likely to call. The sample is unlikely to represent all residents.',
        'Residents who do not use the gym have no chance of being chosen, so a group that likely exercises less is left out.',
        'The question’s wording pushes respondents toward one answer. Calling the fee “unfair” in the question can change how people respond.',
      ][v]);
    },
    scenes('Experimental design', 'Experimental design', [
      { q: 'In an experiment, why are subjects randomly assigned to treatments?', a: 'To create groups that are roughly alike, so differences in response can be attributed to the treatments', w: ['To make the results generalize to a larger population', 'To make sure the sample is large enough', 'To remove the need for a control group'], why: 'Random assignment balances other variables across groups on average, which supports cause-and-effect conclusions. Random sampling is what supports generalizing to a population.' },
      { q: 'A fertilizer study uses two fields, one sunny and one shaded. Within each field, plots are randomly assigned to fertilizer or no fertilizer. What kind of design is this?', a: 'A randomized block design, with field as the blocking variable', w: ['A completely randomized design', 'A matched pairs design', 'An observational study'], why: 'Grouping plots by a variable that affects growth, then randomizing within each group, is blocking. It removes the sun-versus-shade difference from the comparison.' },
      { q: 'In a double-blind experiment, who does not know which treatment each subject receives?', a: 'Both the subjects and the people who measure the response', w: ['Only the subjects', 'Only the people who measure the response', 'Only the statisticians who analyze the data'], why: 'Double-blinding keeps expectations from affecting both how subjects respond and how outcomes are judged or recorded.' },
    ]),
    scenes('Scope of inference', 'Concept application', [
      { q: 'A survey of students finds that those who eat breakfast have higher average grades. No treatment was assigned. Which conclusion is appropriate?', a: 'There is an association, but the study cannot show that breakfast causes higher grades', w: ['Eating breakfast causes higher grades', 'There is no association because it was not an experiment', 'The result only applies to students who skip breakfast'], why: 'Observational studies can show association, but other variables, such as sleep or family routines, could explain the difference.' },
      { q: 'Volunteers were randomly assigned to one of two diets, and one diet produced greater weight loss. What is the appropriate scope of inference?', a: 'The diet caused greater weight loss for subjects like these volunteers, but the result may not generalize to everyone', w: ['The diet causes greater weight loss for all adults', 'Only an association can be concluded', 'No conclusion is possible without a random sample'], why: 'Random assignment allows a cause-and-effect conclusion. Because the subjects were volunteers rather than a random sample, generalizing to a population is limited.' },
      { q: 'A random sample of a city’s adults shows that those who walk to work report lower stress. No treatment was assigned. What is the appropriate scope of inference?', a: 'The association can be generalized to the city’s adults, but walking cannot be shown to reduce stress', w: ['Walking to work causes lower stress for the city’s adults', 'The results apply only to the people in the sample', 'Neither generalization nor causation is possible'], why: 'Random sampling supports generalizing to the population sampled. Without random assignment, the study cannot establish cause and effect.' },
    ]),
  ],
  [ // Unit 4: Probability, Random Variables, and Probability Distributions
    v => {
      const [pa, pb] = [[0.4, 0.3], [0.5, 0.2], [0.3, 0.6]][v];
      const cases = [
        { ask: 'P(A and B)', a: pa * pb, w: [pa + pb, pa + pb - pa * pb, pa * (1 - pb)] },
        { ask: 'P(A or B)', a: pa + pb - pa * pb, w: [pa + pb, pa * pb, (1 - pa) * (1 - pb)] },
        { ask: 'P(neither A nor B)', a: (1 - pa) * (1 - pb), w: [1 - pa - pb, pa * pb, 1 - pa * pb] },
      ][v];
      return m('Probability rules', 'Mathematical reasoning', 'Events A and B are independent, with P(A) = ' + pa + ' and P(B) = ' + pb + '. What is ' + cases.ask + '?', num(cases.a), cases.w.map(value => num(value)), 'For independent events, P(A and B) = P(A)·P(B). The addition rule subtracts that overlap: P(A or B) = P(A) + P(B) − P(A and B). Neither = (1 − P(A))(1 − P(B)).');
    },
    v => {
      const [yy, yn, ny, nn] = [[12, 48, 18, 22], [15, 35, 25, 25], [8, 32, 22, 38]][v]; const total = yy + yn + ny + nn;
      return m('Conditional probability', 'Data analysis', 'A student is chosen at random. Given that the student owns a pet, what is the probability that the student has an allergy?', num(yy / (yy + yn)), [num(yy / (yy + ny)), num(yy / total), num((yy + ny) / total)], 'Restrict to pet owners: ' + yy + ' of ' + (yy + yn) + ' have an allergy. P(pet | allergy) reverses the condition, and dividing by all students gives a joint or overall probability instead.', table('Pet owner | Allergy | No allergy\nYes | ' + yy + ' | ' + yn + '\nNo | ' + ny + ' | ' + nn));
    },
    v => {
      const dist = [{ x: [0, 1, 2, 3], p: [0.1, 0.3, 0.4, 0.2] }, { x: [0, 10, 50], p: [0.7, 0.25, 0.05] }, { x: [1, 2, 3, 4], p: [0.4, 0.3, 0.2, 0.1] }][v];
      const expected = dist.x.reduce((s, x, i) => s + x * dist.p[i], 0);
      const plain = dist.x.reduce((s, x) => s + x, 0) / dist.x.length; const mode = dist.x[dist.p.indexOf(Math.max(...dist.p))];
      return m('Expected value', 'Mathematical reasoning', 'The table gives the probability distribution of X. What is the expected value of X?', short(expected), [short(plain), short(mode), short(dist.x.reduce((s, x) => s + x, 0))], 'E(X) = Σ x·P(x), weighting each value by its probability, which gives ' + short(expected) + '. A plain average of the values ignores that some values are more likely.', table('X | ' + dist.x.join(' | ') + '\nP(X) | ' + dist.p.join(' | ')));
    },
    v => {
      const [n, p, k] = [[5, 0.5, 2], [4, 0.3, 1], [3, 0.2, 2]][v];
      const choose = (a: number, b: number) => { let r = 1; for (let i = 1; i <= b; i += 1) r = (r * (a - b + i)) / i; return r; };
      const core = p ** k * (1 - p) ** (n - k);
      return m('Binomial probability', 'Mathematical reasoning', 'X is binomial with n = ' + n + ' trials and success probability p = ' + p + '. What is P(X = ' + k + ')?', num(choose(n, k) * core, 4), [num(core, 4), num(p ** k, 4), num(k / n, 4)], 'P(X = k) = C(n, k)·p^k·(1 − p)^(n − k). C(' + n + ', ' + k + ') = ' + choose(n, k) + ' counts the different orders in which the successes can occur; leaving it out gives the probability of one particular order.', formula('P(X = k) = C(n, k) · p^k · (1 − p)^(n − k)'));
    },
  ],
  [ // Unit 5: Sampling Distributions
    v => {
      const [p, n] = [[0.4, 100], [0.3, 200], [0.6, 150]][v]; const variance = p * (1 - p);
      return m('Sampling distribution of p̂', 'Mathematical reasoning', 'Random samples of size ' + n + ' are taken from a population with proportion p = ' + p + '. What is the standard deviation of the sampling distribution of p̂?', num(Math.sqrt(variance / n), 3), [num(variance / n, 3), num(Math.sqrt(variance), 3), num(variance, 3)], 'σ_p̂ = √(p(1 − p)/n) = √(' + short(variance) + '/' + n + ') ≈ ' + num(Math.sqrt(variance / n), 3) + '. Without the square root this is the variance, and without n it is the spread of individual observations.', formula('σ_p̂ = √( p(1 − p) / n )'));
    },
    scenes('Central limit theorem', 'Concept application', [
      { q: 'A population of household incomes is strongly right-skewed. Random samples of size 60 are taken. What is the approximate shape of the sampling distribution of the sample mean?', a: 'Approximately normal', w: ['Strongly right-skewed, like the population', 'Uniform', 'Left-skewed'], why: 'The central limit theorem says that for large enough samples the sampling distribution of x̄ is approximately normal, whatever the population’s shape.' },
      { q: 'As the sample size increases, what happens to the standard deviation of the sampling distribution of x̄?', a: 'It decreases', w: ['It increases', 'It stays the same', 'It becomes equal to the population standard deviation'], why: 'σ_x̄ = σ/√n, so larger samples produce sample means that vary less from sample to sample.' },
      { q: 'Which condition allows a normal model to be used for the sampling distribution of p̂?', a: 'np ≥ 10 and n(1 − p) ≥ 10', w: ['n ≥ 30, regardless of p', 'The population itself is normal', 'p is exactly 0.5'], why: 'The large counts condition requires enough expected successes and failures. n ≥ 30 is a common guideline for means, not proportions.' },
    ]),
    scenes('Bias and variability', 'Concept application', [
      { q: 'What does it mean for a statistic to be an unbiased estimator of a parameter?', a: 'The mean of its sampling distribution equals the parameter', w: ['It equals the parameter in every sample', 'It has the smallest possible spread', 'It comes from a large sample'], why: 'Unbiased describes the center of the sampling distribution. Individual samples still vary above and below the parameter.' },
      { q: 'Estimator A’s sampling distribution is centered on the parameter but widely spread. Estimator B’s is narrow but centered above the parameter. Which description is correct?', a: 'A is unbiased with high variability; B is biased with low variability', w: ['A is biased with high variability; B is unbiased with low variability', 'Both are unbiased because they estimate the same parameter', 'Both are biased because each one misses the parameter in some samples'], why: 'Bias concerns where the sampling distribution is centered; variability concerns how spread out it is. They are separate properties.' },
      { q: 'A voluntary response survey is repeated with a much larger sample. What does the larger sample improve?', a: 'It reduces variability, but not the bias from voluntary response', w: ['It removes the voluntary response bias', 'It reduces both bias and variability', 'It improves neither'], why: 'Larger samples make estimates vary less, but a flawed collection method keeps producing estimates centered in the wrong place.' },
    ]),
    v => {
      const [sigma, n] = [[15, 25], [12, 36], [20, 16]][v]; const sd = sigma / Math.sqrt(n);
      return m('Sampling distribution of x̄', 'Mathematical reasoning', 'A population has standard deviation σ = ' + sigma + '. For random samples of size ' + n + ', what is the standard deviation of the sampling distribution of x̄?', short(sd), [short(sigma / n), short(sigma), short(sigma * Math.sqrt(n))], 'σ_x̄ = σ/√n = ' + sigma + '/√' + n + ' = ' + short(sd) + '. Dividing by n instead of √n understates the spread.', formula('σ_x̄ = σ / √n'));
    },
  ],
  [ // Unit 6: Inference for Categorical Data: Proportions
    v => {
      const [phat, n] = [[0.62, 400], [0.45, 300], [0.3, 500]][v]; const se = Math.sqrt((phat * (1 - phat)) / n);
      const show = (me: number) => num(phat) + ' ± ' + num(me, 3);
      return m('Confidence interval for a proportion', 'Mathematical reasoning', 'In a random sample of ' + n + ' adults, p̂ = ' + num(phat) + '. Which is a 95% confidence interval for the population proportion? Use z* = 1.96.', show(1.96 * se), [show(1.96 * (phat * (1 - phat)) / n), show(1.645 * se), show(se)], 'SE = √(p̂(1 − p̂)/n) ≈ ' + num(se, 4) + ', and the margin of error is z*·SE = 1.96 × ' + num(se, 4) + ' ≈ ' + num(1.96 * se, 3) + '. 1.645 is the critical value for 90% confidence.', formula('p̂ ± z* √( p̂(1 − p̂) / n )'));
    },
    scenes('Interpreting confidence', 'Concept application', [
      { q: 'A 95% confidence interval for the proportion of a city’s voters who support a measure is (0.41, 0.49). Which interpretation is correct?', a: 'We are 95% confident that the interval from 0.41 to 0.49 captures the proportion of all the city’s voters who support the measure', w: ['95% of the city’s voters support the measure', 'There is a 95% probability that the sample proportion is between 0.41 and 0.49', '95% of all samples will have a proportion between 0.41 and 0.49'], why: 'Confidence is about the population parameter and the method. The sample proportion is known exactly; it is the unknown parameter the interval tries to capture.' },
      { q: 'What does “95% confidence” mean?', a: 'In repeated random sampling, about 95% of intervals made this way would capture the true parameter', w: ['There is a 95% chance this particular sample is unbiased', '95% of the data fall inside the interval', 'The parameter changes so that it falls in the interval 95% of the time'], why: 'The confidence level describes the long-run success rate of the method, not the data or a changing parameter.' },
      { q: 'A researcher keeps the confidence level the same but quadruples the sample size. What happens to the margin of error?', a: 'It is cut roughly in half', w: ['It is cut to about one quarter', 'It doubles', 'It stays the same'], why: 'Margin of error is proportional to 1/√n. Multiplying n by 4 divides the margin of error by √4 = 2.' },
    ]),
    v => {
      const cases = [
        { q: 'A company claims that 80% of its customers are satisfied. A consumer group suspects the true proportion is lower. Which hypotheses fit?', a: 'H₀: p = 0.80, Hₐ: p < 0.80', w: ['H₀: p̂ = 0.80, Hₐ: p̂ < 0.80', 'H₀: p < 0.80, Hₐ: p = 0.80', 'H₀: p = 0.80, Hₐ: p ≠ 0.80'] },
        { q: 'About 10% of people are left-handed. A researcher suspects the proportion is higher among artists. Which hypotheses fit?', a: 'H₀: p = 0.10, Hₐ: p > 0.10', w: ['H₀: p̂ = 0.10, Hₐ: p̂ > 0.10', 'H₀: p > 0.10, Hₐ: p = 0.10', 'H₀: p = 0.10, Hₐ: p ≠ 0.10'] },
        { q: 'A student wants to know whether a coin lands heads a different proportion of the time than 0.5. Which hypotheses fit?', a: 'H₀: p = 0.5, Hₐ: p ≠ 0.5', w: ['H₀: p̂ = 0.5, Hₐ: p̂ ≠ 0.5', 'H₀: p ≠ 0.5, Hₐ: p = 0.5', 'H₀: p = 0.5, Hₐ: p > 0.5'] },
      ][v];
      return m('Hypotheses for a proportion', 'Concept application', cases.q, cases.a, cases.w, 'Hypotheses are about the population parameter p, not the sample statistic p̂. The null states the claimed value, and the alternative matches the direction the question asks about.');
    },
    scenes('P-values and errors', 'Concept application', [
      { q: 'A significance test at α = 0.05 gives a p-value of 0.03. Which conclusion is appropriate?', a: 'Reject H₀; there is convincing evidence for the alternative hypothesis', w: ['Fail to reject H₀', 'H₀ is true with probability 0.03', 'Accept H₀ because 0.03 is small'], why: 'A p-value below α means results this extreme would be unusual if H₀ were true, so H₀ is rejected. A p-value is not the probability that H₀ is true.' },
      { q: 'H₀ states that a new medication is no more effective than the current one. What would a Type I error be?', a: 'Concluding the new medication is more effective when it is not', w: ['Concluding the new medication is not more effective when it is', 'Using a sample that is too small', 'Calculating the p-value incorrectly'], why: 'A Type I error rejects a true null hypothesis. Here that means wrongly concluding the new medication works better.' },
      { q: 'Which change would increase the power of a significance test?', a: 'Increasing the sample size', w: ['Lowering α from 0.05 to 0.01', 'Decreasing the sample size', 'Switching from a one-sided to a two-sided test in the correct direction'], why: 'Power is the chance of rejecting a false null. Larger samples reduce variability and make real differences easier to detect; a smaller α makes rejection harder.' },
    ]),
  ],
  [ // Unit 7: Inference for Quantitative Data: Means
    v => {
      const [s, n, t] = [[8, 16, 2.131], [9, 9, 2.306], [15, 25, 2.064]][v]; const se = s / Math.sqrt(n);
      return m('Margin of error for a mean', 'Mathematical reasoning', 'A random sample of ' + n + ' has standard deviation s = ' + s + '. For a 95% confidence interval for μ, t* = ' + t + '. What is the margin of error?', num(t * se), [num(t * s), num(1.96 * se), num(se)], 'SE = s/√n = ' + s + '/√' + n + ' = ' + num(se) + '. Margin of error = t*·SE = ' + t + ' × ' + num(se) + ' ≈ ' + num(t * se) + '. With σ unknown, t* is used rather than z*.', formula('margin of error = t* · s / √n'));
    },
    v => {
      const answer = ['A paired t procedure on the differences', 'A two-sample t procedure', 'A paired t procedure on the differences'][v];
      return m('Paired or two-sample', 'Concept application', [
        'Each student takes a reading test before and after a summer program. Which procedure fits a comparison of mean scores?',
        'Commute times are recorded for a random sample of workers in each of two cities. Which procedure fits a comparison of mean commute times?',
        'In each of 20 pairs of twins, one twin is randomly assigned diet A and the other diet B. Which procedure fits a comparison of mean weight change?',
      ][v], answer, ['A two-sample t procedure', 'A paired t procedure on the differences', 'A one-sample z procedure for a proportion', 'A chi-square test of independence'].filter(value => value !== answer), [
        'Each student contributes two related measurements. Analyzing the before-after differences removes student-to-student variation.',
        'The two samples are independent groups of different people, so a two-sample t procedure compares their means.',
        'Twins are matched, so each pair produces one difference. Treating the twins as independent groups would ignore that pairing.',
      ][v]);
    },
    scenes('Conditions for t procedures', 'Concept application', [
      { q: 'A random sample of 12 is taken from a population with an unknown shape. What should be checked before using a t procedure?', a: 'That the sample data show no strong skewness or outliers', w: ['That n is at least 30', 'That np and n(1 − p) are at least 10', 'That the population standard deviation is known'], why: 'With small samples, t procedures need a roughly normal population. A graph of the sample without strong skew or outliers makes that plausible.' },
      { q: 'A random sample of 60 comes from a strongly skewed population. Is a t procedure for the mean reasonable?', a: 'Yes, because the sample is large enough for the central limit theorem to apply', w: ['No, because the population is not normal', 'No, because t procedures require n ≤ 30', 'Yes, but only if σ is known'], why: 'With a sample this large, the sampling distribution of x̄ is approximately normal even when the population is skewed.' },
      { q: 'A researcher samples 50 students without replacement from a school of 300 to estimate mean sleep. Which condition is not met?', a: 'The 10% condition, because 50 is more than 10% of 300', w: ['The large counts condition', 'The random condition', 'The condition that n must be at least 30'], why: 'When sampling without replacement, observations are treated as independent only if the sample is at most 10% of the population. Here it is about 17%.' },
    ]),
    scenes('Conclusions about means', 'Concept application', [
      { q: 'A test of H₀: μ = 500 against Hₐ: μ ≠ 500 gives a p-value of 0.20. Which conclusion is appropriate at α = 0.05?', a: 'The data do not provide convincing evidence that the mean differs from 500', w: ['The data prove that the mean is 500', 'The mean is 500 with probability 0.20', 'Reject H₀ because 0.20 is greater than 0.05'], why: 'A large p-value means the data are consistent with H₀. Failing to reject is not the same as proving H₀ true.' },
      { q: 'A 95% confidence interval for μ is (4.1, 5.3). At α = 0.05, would a two-sided test reject H₀: μ = 5?', a: 'No, because 5 is inside the interval', w: ['Yes, because 5 is not the center of the interval', 'Yes, because the interval does not contain 0', 'It cannot be decided without the p-value'], why: 'A 95% interval contains the plausible values of μ. A two-sided test at α = 0.05 rejects only values outside it, and 5 is inside.' },
      { q: 'A study of 50,000 students finds a mean improvement of 0.2 points on a 100-point test, with p < 0.001. Which statement is most accurate?', a: 'The result is statistically significant, but the improvement may be too small to matter in practice', w: ['The improvement must be large because the p-value is small', 'The result cannot be significant because 0.2 is small', 'The study proves the program improves every student’s score'], why: 'With very large samples, even tiny differences can be statistically significant. Whether the effect matters is a separate, practical question.' },
    ]),
  ],
  [ // Unit 8: Inference for Categorical Data: Chi-Square
    v => {
      const c = [{ n: 200, props: [0.5, 0.3, 0.2], ask: 1, obs: [96, 52, 52] }, { n: 150, props: [0.4, 0.4, 0.2], ask: 2, obs: [55, 58, 37] }, { n: 300, props: [0.25, 0.25, 0.5], ask: 2, obs: [80, 79, 141] }][v];
      const expected = c.n * c.props[c.ask];
      return m('Expected counts', 'Mathematical reasoning', 'A sample of ' + c.n + ' is classified into three categories. The claimed proportions are ' + c.props.join(', ') + '. What is the expected count for category ' + (c.ask + 1) + '?', short(expected), [String(c.obs[c.ask]), short(c.n / 3), short(c.n * c.props[0])], 'Expected count = n × claimed proportion = ' + c.n + ' × ' + c.props[c.ask] + ' = ' + short(expected) + '. The observed count is what the sample actually shows.', table('Category | 1 | 2 | 3\nObserved | ' + c.obs.join(' | ')));
    },
    v => {
      const cases = [
        { q: 'A sample of 120 is classified into 5 categories for a chi-square goodness-of-fit test. How many degrees of freedom does the test have?', a: 4, w: [5, 119, 3] },
        { q: 'A chi-square test of independence uses a two-way table with 3 rows and 4 columns. How many degrees of freedom does the test have?', a: 6, w: [12, 11, 5] },
        { q: 'A sample of 90 is classified into 6 categories for a chi-square goodness-of-fit test. How many degrees of freedom does the test have?', a: 5, w: [6, 89, 4] },
      ][v];
      return m('Degrees of freedom', 'Mathematical reasoning', cases.q, cases.a, cases.w, 'Goodness of fit uses (number of categories − 1). A two-way table uses (rows − 1)(columns − 1). The sample size does not set the degrees of freedom for chi-square tests.');
    },
    v => {
      const answer = ['Chi-square goodness-of-fit test', 'Chi-square test of independence', 'Chi-square test of homogeneity'][v];
      return m('Choosing a chi-square test', 'Concept application', [
        'A candy company claims its color mix is 30% red, 20% blue and 50% other. One random bag is used to check the claim. Which test fits?',
        'One random sample of students is classified by grade level and preferred lunch option. Is there an association? Which test fits?',
        'Separate random samples are taken at three schools and each student’s commute mode is recorded. Do the distributions differ? Which test fits?',
      ][v], answer, ['Chi-square goodness-of-fit test', 'Chi-square test of independence', 'Chi-square test of homogeneity', 'Two-sample t test for means'].filter(value => value !== answer), [
        'One categorical variable is compared with a claimed distribution, which is a goodness-of-fit test.',
        'One sample, two categorical variables, and a question about association: that is a test of independence.',
        'Several independent samples compared on one categorical variable call for a test of homogeneity.',
      ][v]);
    },
    v => {
      const [o, e] = [[30, 25], [18, 24], [50, 40]][v]; const part = (o - e) ** 2 / e;
      return m('Chi-square components', 'Mathematical reasoning', 'In one cell of a chi-square test, the observed count is ' + o + ' and the expected count is ' + e + '. What is that cell’s contribution to the chi-square statistic?', num(part), [num((o - e) / e), short((o - e) ** 2), num((o - e) ** 2 / o)], 'Each cell contributes (observed − expected)² / expected = (' + o + ' − ' + e + ')² / ' + e + ' = ' + num(part) + '. Dividing by the expected count, not the observed, puts each cell on a comparable scale.', formula('χ² = Σ (observed − expected)² / expected'));
    },
  ],
  [ // Unit 9: Inference for Quantitative Data: Slopes
    v => {
      const c = [{ const: 12.4, coef: 3.18, se: 0.95 }, { const: 6.1, coef: 2.4, se: 0.6 }, { const: 5.2, coef: 1.75, se: 0.5 }][v];
      const output = table('Predictor | Coef | SE Coef | T | P\nConstant | ' + c.const + ' | 2.1 | ' + num(c.const / 2.1) + ' | 0.001\nHours | ' + c.coef + ' | ' + c.se + ' | ' + num(c.coef / c.se) + ' | 0.002');
      if (v === 0) return m('Regression output', 'Data analysis', 'Computer output for a regression of score on hours of practice is shown. What is the test statistic for H₀: β = 0?', num(c.coef / c.se), [String(c.coef), String(c.se), '0.002'], 't = (b − 0) / SE_b = ' + c.coef + ' / ' + c.se + ' ≈ ' + num(c.coef / c.se) + '. The coefficient is the sample slope, and 0.002 is the p-value.', output);
      if (v === 1) return m('Regression output', 'Data analysis', 'Computer output for a regression of score on hours of practice is shown. With t* = 2.042, which is a 95% confidence interval for the true slope?', c.coef + ' ± ' + num(2.042 * c.se), [c.coef + ' ± ' + num(c.se), c.coef + ' ± ' + num(1.96 * c.se), c.coef + ' ± ' + num(2.042 * c.coef)], 'The interval is b ± t*·SE_b = ' + c.coef + ' ± 2.042 × ' + c.se + '. The standard error of the slope, not the slope itself, measures its sampling variability.', output);
      return m('Regression output', 'Data analysis', 'Computer output for a regression of score on hours of practice is shown. What score does the model predict for 10 hours of practice?', short(c.const + 10 * c.coef), [short(10 * c.coef), short(10 * c.const + c.coef), short(c.const + c.coef)], 'The line is ŷ = ' + c.const + ' + ' + c.coef + 'x. Substituting x = 10 gives ' + short(c.const + 10 * c.coef) + '. The constant is the intercept and the Hours coefficient is the slope.', output);
    },
    v => {
      const answer = ['The linear condition is not met', 'The equal-variance condition is not met', 'The normality condition is questionable'][v];
      return m('Conditions for slope inference', 'Concept application', [
        'A residual plot for a regression shows a clear curved pattern. Which conclusion about the conditions for inference on the slope is correct?',
        'A residual plot shows residuals that spread out more and more as x increases. Which conclusion about the conditions for inference on the slope is correct?',
        'With only 12 points, a histogram of the residuals is strongly skewed with an outlier. Which conclusion about the conditions for inference on the slope is correct?',
      ][v], answer, ['The linear condition is not met', 'The equal-variance condition is not met', 'The normality condition is questionable', 'The independence condition is not met'].filter(value => value !== answer), [
        'A curve in the residual plot means a straight line misses the true pattern, so the linear condition fails.',
        'A fan shape means the spread of y about the line changes with x, violating the equal standard deviation condition.',
        'With few points, strongly skewed residuals or outliers make the normality condition doubtful.',
      ][v]);
    },
    v => {
      const cases = [
        { q: 'Is there convincing evidence of a positive linear relationship between hours studied and test score in the population?', a: 'H₀: β = 0, Hₐ: β > 0', w: ['H₀: b = 0, Hₐ: b > 0', 'H₀: β > 0, Hₐ: β = 0', 'H₀: β = 0, Hₐ: β ≠ 0'] },
        { q: 'Is there convincing evidence of any linear relationship between temperature and electricity use in the population?', a: 'H₀: β = 0, Hₐ: β ≠ 0', w: ['H₀: b = 0, Hₐ: b ≠ 0', 'H₀: β ≠ 0, Hₐ: β = 0', 'H₀: β = 0, Hₐ: β > 0'] },
        { q: 'Is there convincing evidence of a negative linear relationship between a car’s age and its price in the population?', a: 'H₀: β = 0, Hₐ: β < 0', w: ['H₀: b = 0, Hₐ: b < 0', 'H₀: β < 0, Hₐ: β = 0', 'H₀: β = 0, Hₐ: β ≠ 0'] },
      ][v];
      return m('Hypotheses for a slope', 'Concept application', cases.q, cases.a, cases.w, 'Hypotheses concern the population slope β, not the sample slope b. The null hypothesis is no linear relationship, β = 0, and the alternative matches the direction in the question.');
    },
    scenes('Interpreting a slope interval', 'Concept application', [
      { q: 'A 95% confidence interval for the slope of the regression of score on hours studied is (0.8, 2.4). Which interpretation is correct?', a: 'We are 95% confident that the true average increase in score for each additional hour studied is between 0.8 and 2.4 points', w: ['There is a 95% probability that the sample slope is between 0.8 and 2.4', '95% of the data points lie within 0.8 to 2.4 points of the line', 'The correlation between hours and score is between 0.8 and 2.4'], why: 'The interval estimates the population slope, the average change in y per unit of x. The sample slope is known exactly.' },
      { q: 'A 95% confidence interval for a population slope is (−0.3, 1.1). What does this suggest at α = 0.05?', a: 'Zero is a plausible slope, so there is not convincing evidence of a linear relationship', w: ['There is convincing evidence of a positive relationship', 'There is convincing evidence of a negative relationship', 'The slope must be exactly 0.4'], why: 'Because the interval includes 0, a slope of 0 (no linear relationship) is plausible. A two-sided test at α = 0.05 would not reject H₀: β = 0.' },
      { q: 'A 95% confidence interval for a population slope is (−2.1, −0.7). What does this suggest at α = 0.05?', a: 'There is convincing evidence of a negative linear relationship', w: ['Zero is a plausible value for the slope', 'There is convincing evidence of a positive linear relationship', 'Every point lies below the regression line'], why: 'Every plausible value in the interval is negative and 0 is excluded, so the data give convincing evidence that the population slope is negative.' },
    ]),
  ],
  [ // Mixed review across units
    u(0, v => {
      const answer = ['Skewed to the right', 'Skewed to the left', 'Roughly symmetric'][v];
      return m('Shape, mean and median', 'Concept application', [
        'For a distribution of home prices, the mean is much greater than the median. What is the most likely shape?',
        'For a distribution of scores on an easy test, the mean is noticeably less than the median. What is the most likely shape?',
        'For a distribution of adult heights, the mean and median are nearly equal and there are no outliers. What is the most likely shape?',
      ][v], answer, ['Skewed to the right', 'Skewed to the left', 'Roughly symmetric', 'Uniform'].filter(value => value !== answer), [
        'A long right tail of very expensive homes pulls the mean up more than the median.',
        'A few low scores form a left tail that pulls the mean below the median.',
        'When the mean and median are close and there are no outliers, the distribution is likely roughly symmetric.',
      ][v]);
    }),
    u(3, v => {
      const answer = ['About 68%', 'About 95%', 'About 16%'][v];
      return m('Normal distributions', 'Mathematical reasoning', [
        'IQ scores are approximately normal with mean 100 and standard deviation 15. About what percent of scores are between 85 and 115?',
        'IQ scores are approximately normal with mean 100 and standard deviation 15. About what percent of scores are between 70 and 130?',
        'IQ scores are approximately normal with mean 100 and standard deviation 15. About what percent of scores are above 115?',
      ][v], answer, ['About 68%', 'About 95%', 'About 16%', 'About 2.5%'].filter(value => value !== answer), 'By the empirical rule, about 68% of values lie within one standard deviation of the mean and about 95% within two. Half of the remaining 32%, about 16%, lies above one standard deviation.');
    }),
    u(5, v => {
      const [shrink, factor] = [[2, 4], [3, 9], [4, 16]][v];
      return m('Sample size and margin of error', 'Mathematical reasoning', 'A pollster wants to divide the margin of error by ' + shrink + ' while keeping the same confidence level. By what factor must the sample size be multiplied?', factor, [shrink, 2 * factor, factor * factor], 'Margin of error is proportional to 1/√n. Dividing it by ' + shrink + ' requires √n to be multiplied by ' + shrink + ', so n must be multiplied by ' + shrink + '² = ' + factor + '.');
    }),
    u(2, scenes('Confounding variables', 'Concept application', [
      { q: 'Across a city’s fires, more firefighters at a scene is associated with more damage. Which explanation is most reasonable?', a: 'Larger fires bring more firefighters and also cause more damage', w: ['Firefighters cause the damage', 'More damage causes more firefighters to be trained', 'The association must be due to a calculation error'], why: 'Fire size is related to both variables. It confounds the relationship, so the data cannot show that firefighters cause damage.' },
      { q: 'Weekly ice cream sales and the number of drownings at a beach are positively associated. Which explanation is most reasonable?', a: 'Hot weather increases both ice cream sales and swimming', w: ['Eating ice cream causes drownings', 'Drownings cause people to buy ice cream', 'The variables cannot both be numbers'], why: 'Temperature drives both variables. Observational data like these show association, not causation.' },
      { q: 'Students who use a school’s tutoring center have lower average grades than students who do not. Which explanation is most reasonable?', a: 'Students who are already struggling are more likely to seek tutoring', w: ['Tutoring lowers students’ grades', 'Grades and tutoring use cannot be related', 'The tutoring center must be teaching incorrect material'], why: 'Students choose whether to use tutoring, and those choosing it may differ from others in ways that also affect grades. Without random assignment, causation cannot be concluded.' },
    ])),
  ],
];

export const statisticsExamQuestions = buildExamBank('ap-stats', areas);
