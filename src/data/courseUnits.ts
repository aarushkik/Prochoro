
/**
 * Course content: ten areas per AP course, six teaching topics per area.
 *
 * Unit titles follow the real shape of each course so the map matches what a
 * student sees in class. The six topics per unit are what the builder turns
 * into the area's six stages — one lesson each, then a support stop, then that
 * stage's boss. All content here is original study scaffolding, not real exam
 * material.
 */

export interface UnitSpec {
  title: string;
  /** One line of flavor under the unit title on the area banner. */
  blurb: string;
  /** Six teaching topics, in order. One per stage. */
  topics: [string, string, string, string, string, string];
}

/**
 * The landscape each course walks through, area 1 to area 10.
 *
 * Every course gets a different route so two students on different subjects
 * never see the same map, and each route is ordered so the country gets
 * rougher as the material does — gentle green early, caverns and summits late.
 */
/** Fallback route for a course with no dedicated one. */

export const COURSE_UNITS: Record<string, UnitSpec[]> = {
  'ap-biology': [
    {
      title: 'Chemistry of Life',
      blurb: 'The molecules everything else is built from.',
      topics: ['Water and hydrogen bonding', 'Carbon skeletons', 'Proteins and structure', 'Nucleic acids', 'Lipids and carbohydrates', 'Properties of macromolecules'],
    },
    {
      title: 'Cell Structure & Function',
      blurb: 'Where every living thing starts.',
      topics: ['Cell size and surface area', 'Organelles and their jobs', 'The endomembrane system', 'Membrane structure', 'Transport across membranes', 'Osmosis and water potential'],
    },
    {
      title: 'Cellular Energetics',
      blurb: 'How a cell pays for everything it does.',
      topics: ['Enzymes and catalysis', 'Enzyme regulation', 'Energy and ATP', 'Photosynthesis', 'Cellular respiration', 'Fermentation'],
    },
    {
      title: 'Cell Communication & Cycle',
      blurb: 'Signals in, division out.',
      topics: ['Signal transduction', 'Feedback loops', 'Stages of the cell cycle', 'Mitosis', 'Cell cycle checkpoints', 'Cancer and lost control'],
    },
    {
      title: 'Heredity',
      blurb: 'How traits get handed down.',
      topics: ['Meiosis', 'Sources of genetic variation', 'Mendelian genetics', 'Non-Mendelian patterns', 'Chi-square analysis', 'Environment and phenotype'],
    },
    {
      title: 'Gene Expression & Regulation',
      blurb: 'From sequence to living thing.',
      topics: ['DNA structure', 'Replication', 'Transcription', 'Translation', 'Regulating gene expression', 'Mutations and biotechnology'],
    },
    {
      title: 'Natural Selection',
      blurb: 'Why life looks the way it does.',
      topics: ['Evidence for evolution', 'Natural selection', 'Hardy-Weinberg equilibrium', 'Speciation', 'Reading phylogenies', 'Origin of life'],
    },
    {
      title: 'Ecology',
      blurb: 'Life at the scale of whole systems.',
      topics: ['Energy flow', 'Population ecology', 'Community interactions', 'Ecosystem dynamics', 'Biodiversity', 'Human impact'],
    },
    {
      title: 'Lab & Data Analysis',
      blurb: 'Turning measurements into claims.',
      topics: ['Experimental design', 'Controls and variables', 'Graphing data', 'Statistics and error bars', 'Interpreting results', 'Writing conclusions'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Multiple-choice strategy', 'Reading stimulus questions', 'Short free response', 'Long free response', 'Data analysis FRQs', 'Full timed practice'],
    },
  ],
  'ap-calc-ab': [
    {
      title: 'Limits & Continuity',
      blurb: 'The idea the whole course rests on.',
      topics: ['Limits from graphs', 'Algebraic limits', 'One-sided limits', 'Limits at infinity', 'Continuity', 'IVT and squeeze theorem'],
    },
    {
      title: 'Differentiation: Basic Rules',
      blurb: 'Measuring change, precisely.',
      topics: ['Defining the derivative', 'Differentiability', 'Power rule', 'Product rule', 'Quotient rule', 'Trig derivatives'],
    },
    {
      title: 'Composite & Implicit Functions',
      blurb: 'Derivatives that need a second move.',
      topics: ['The chain rule', 'Implicit differentiation', 'Inverse functions', 'Inverse trig derivatives', 'Higher-order derivatives', 'Selecting procedures'],
    },
    {
      title: 'Contextual Applications',
      blurb: 'Derivatives that mean something.',
      topics: ['Motion and rates', 'Related rates', 'Linear approximation', "L'Hospital's rule", 'Interpreting units', 'Modeling with derivatives'],
    },
    {
      title: 'Analytical Applications',
      blurb: 'What the derivative says about the graph.',
      topics: ['Mean value theorem', 'Increasing and decreasing', 'First derivative test', 'Concavity', 'Second derivative test', 'Optimization'],
    },
    {
      title: 'Integration & Accumulation',
      blurb: 'Adding up infinitely many pieces.',
      topics: ['Riemann sums', 'Definite integrals', 'Fundamental theorem', 'Antiderivatives', 'U-substitution', 'Accumulation functions'],
    },
    {
      title: 'Differential Equations',
      blurb: 'Equations that describe change itself.',
      topics: ['Modeling with differential equations', 'Slope fields', 'Separation of variables', 'Initial conditions', 'Exponential models', 'Verifying solutions'],
    },
    {
      title: 'Applications of Integration',
      blurb: 'Area, volume, and average value.',
      topics: ['Average value', 'Position from velocity', 'Area between curves', 'Volumes by discs', 'Volumes by washers', 'Cross-section volumes'],
    },
    {
      title: 'Free-Response Craft',
      blurb: 'Getting credit for what you know.',
      topics: ['Justifying answers', 'Notation that scores', 'Calculator problems', 'Non-calculator problems', 'Units and interpretation', 'Common point losses'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Multiple-choice pacing', 'Calculator strategy', 'FRQ part scoring', 'Mixed review', 'Error triage', 'Full timed practice'],
    },
  ],
  'ap-world': [
    {
      title: 'The Global Tapestry',
      blurb: 'States and beliefs, 1200 to 1450.',
      topics: ['Song China', 'Belief systems of Afro-Eurasia', 'Islamic world', 'South and Southeast Asia', 'State building in Africa', 'The Americas before 1500'],
    },
    {
      title: 'Networks of Exchange',
      blurb: 'The routes that rewired the world.',
      topics: ['The Silk Roads', 'The Mongol Empire', 'Indian Ocean trade', 'Trans-Saharan routes', 'Cultural consequences', 'Environmental consequences'],
    },
    {
      title: 'Land-Based Empires',
      blurb: 'Gunpowder and new hierarchies.',
      topics: ['Expanding empires', 'Administering empires', 'Belief and legitimacy', 'Comparing land empires', 'Military technology', 'Economic systems'],
    },
    {
      title: 'Transoceanic Connections',
      blurb: 'Ships, silver, and coercion.',
      topics: ['Advances in navigation', 'Maritime exploration', 'The Columbian Exchange', 'Maritime empires established', 'Coerced labor systems', 'Internal challenges'],
    },
    {
      title: 'Revolutions',
      blurb: 'When old orders broke.',
      topics: ['The Enlightenment', 'Nationalism', 'Atlantic revolutions', 'Industrial revolution begins', 'Spread of industrialization', 'Reactions to capitalism'],
    },
    {
      title: 'Consequences of Industrialization',
      blurb: 'Empire, migration, resistance.',
      topics: ['Rationales for imperialism', 'State expansion', 'Indigenous responses', 'Global economic change', 'Migration patterns', 'Effects of migration'],
    },
    {
      title: 'Global Conflict',
      blurb: 'The century that broke twice.',
      topics: ['Shifting power after 1900', 'Causes of World War I', 'Total war', 'Interwar economies', 'World War II', 'Mass atrocities'],
    },
    {
      title: 'Cold War & Decolonization',
      blurb: 'Two blocs, many new nations.',
      topics: ['Setting the stage', 'The Cold War', 'Effects of the Cold War', 'Newly independent states', 'Global resistance', 'End of the Cold War'],
    },
    {
      title: 'Globalization',
      blurb: 'A world that got smaller.',
      topics: ['Advances in technology', 'Technology and the environment', 'Economic change', 'Calls for reform', 'Global culture', 'Institutions of globalization'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Stimulus multiple choice', 'Short answer questions', 'Document-based question', 'Long essay question', 'Thesis and complexity', 'Full timed practice'],
    },
  ],
  'ap-us-history': [
    {
      title: 'Colliding Worlds',
      blurb: '1491 to 1607 — before and after contact.',
      topics: ['Native societies before 1492', 'European exploration', 'The Columbian Exchange', 'Labor and slavery begins', 'Cultural interactions', 'Competing colonial visions'],
    },
    {
      title: 'Colonial Foundations',
      blurb: '1607 to 1754 — thirteen different places.',
      topics: ['Regional colonial societies', 'Transatlantic trade', 'Interactions with Native peoples', 'Slavery in the colonies', 'Colonial society and culture', 'The Great Awakening'],
    },
    {
      title: 'Revolution & Republic',
      blurb: '1754 to 1800 — a cause becomes a country.',
      topics: ['The Seven Years War', 'The imperial crisis', 'The Revolution', 'Articles of Confederation', 'The Constitution', 'The new republic'],
    },
    {
      title: 'A Growing Nation',
      blurb: '1800 to 1848 — expansion and its costs.',
      topics: ['The market revolution', 'Jacksonian democracy', 'Westward expansion', 'Reform movements', 'Slavery expands', 'American culture'],
    },
    {
      title: 'Crisis & Civil War',
      blurb: '1844 to 1877 — union, war, reconstruction.',
      topics: ['Manifest destiny', 'Compromise and failure', 'Secession', 'The Civil War', 'Emancipation', 'Reconstruction and retreat'],
    },
    {
      title: 'Industrial America',
      blurb: '1865 to 1898 — rails, cities, labor.',
      topics: ['Westward settlement', 'Industrial growth', 'Labor and unions', 'Immigration and cities', 'Politics of the Gilded Age', 'Populism'],
    },
    {
      title: 'Reform & Empire',
      blurb: '1890 to 1945 — power at home and abroad.',
      topics: ['Progressive reform', 'American imperialism', 'World War I', 'The 1920s', 'The Great Depression', 'World War II'],
    },
    {
      title: 'Cold War America',
      blurb: '1945 to 1980 — containment and rights.',
      topics: ['Origins of the Cold War', 'Postwar prosperity', 'The civil rights movement', 'Vietnam', 'Social movements', 'The 1970s'],
    },
    {
      title: 'Contemporary America',
      blurb: '1980 to now — a shifting order.',
      topics: ['Conservative resurgence', 'End of the Cold War', 'Economic change', 'Demographic shifts', 'Digital America', 'Recent debates'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Stimulus multiple choice', 'Short answer questions', 'Document-based question', 'Long essay question', 'Periodization and causation', 'Full timed practice'],
    },
  ],
  'ap-csa': [
    {
      title: 'Primitive Types',
      blurb: 'Types, literals, and your first programs.',
      topics: ['Why programming', 'Variables and data types', 'Expressions and assignment', 'Compound assignment', 'Casting and ranges', 'Integer division and modulus'],
    },
    {
      title: 'Using Objects',
      blurb: 'Working with things someone else wrote.',
      topics: ['Objects and instances', 'Constructors', 'Calling methods', 'String objects', 'String methods', 'The Math class'],
    },
    {
      title: 'Boolean Expressions & if',
      blurb: 'Teaching a program to decide.',
      topics: ['Boolean expressions', 'if statements', 'else and else if', 'Compound conditionals', 'Equivalent boolean expressions', 'Comparing objects'],
    },
    {
      title: 'Iteration',
      blurb: 'Doing it again, correctly.',
      topics: ['while loops', 'for loops', 'Loop patterns', 'Nested loops', 'Informal run-time analysis', 'Loops over strings'],
    },
    {
      title: 'Writing Classes',
      blurb: 'Learning to think in objects.',
      topics: ['Anatomy of a class', 'Constructors', 'Instance variables and scope', 'Writing methods', 'this and static', 'Writing toString'],
    },
    {
      title: 'Array',
      blurb: 'Many values, one name.',
      topics: ['Array creation', 'Traversing arrays', 'Enhanced for loops', 'Array algorithms', 'Searching arrays', 'Common array errors'],
    },
    {
      title: 'ArrayList',
      blurb: 'Lists that grow while you work.',
      topics: ['Introduction to ArrayList', 'ArrayList methods', 'Traversing an ArrayList', 'ArrayList algorithms', 'Searching and sorting', 'Ethical use of data'],
    },
    {
      title: '2D Array',
      blurb: 'Grids, rows, and columns.',
      topics: ['2D array creation', 'Row-major traversal', 'Column-major traversal', 'Nested enhanced for', '2D array algorithms', 'Grid problems'],
    },
    {
      title: 'Text Files and Data',
      blurb: 'Read, check, and process data.',
      topics: ['Reading text files', 'Parsing records', 'Input validation', 'Data privacy', 'Processing data', 'Testing file algorithms'],
    },
    {
      title: 'Algorithms and Recursion',
      blurb: 'Use data to solve a problem.',
      topics: ['Searching collections', 'Sorting collections', 'Recursive methods', 'Base cases', 'Recursive searching', 'Recursive sorting'],
    },
  ],
  'ap-chem': [
    {
      title: 'Atomic Structure & Properties',
      blurb: 'What matter is actually made of.',
      topics: ['Moles and molar mass', 'Mass spectroscopy', 'Electron configuration', 'Photoelectron spectroscopy', 'Periodic trends', 'Valence electrons'],
    },
    {
      title: 'Compound Structure & Properties',
      blurb: 'How atoms hold on to each other.',
      topics: ['Types of chemical bonds', 'Ionic bonding and lattices', 'Covalent bonding', 'Lewis structures', 'VSEPR and geometry', 'Resonance and formal charge'],
    },
    {
      title: 'Substances & Mixtures',
      blurb: 'Forces between particles.',
      topics: ['Intermolecular forces', 'Solids liquids and gases', 'The ideal gas law', 'Deviations from ideal', 'Solutions and concentration', 'Spectroscopy and Beer-Lambert'],
    },
    {
      title: 'Chemical Reactions',
      blurb: 'Counting atoms you can never see.',
      topics: ['Types of reactions', 'Net ionic equations', 'Balancing equations', 'Stoichiometry', 'Limiting reactants', 'Titration calculations'],
    },
    {
      title: 'Kinetics',
      blurb: 'How fast, and why.',
      topics: ['Reaction rates', 'Rate laws', 'Integrated rate laws', 'Collision model', 'Reaction mechanisms', 'Catalysis'],
    },
    {
      title: 'Thermodynamics',
      blurb: 'Energy moving through a reaction.',
      topics: ['Endothermic and exothermic', 'Heat capacity and calorimetry', 'Enthalpy of reaction', "Hess's law", 'Bond enthalpies', 'Energy diagrams'],
    },
    {
      title: 'Equilibrium',
      blurb: 'Which way a reaction settles.',
      topics: ['Reversible reactions', 'The equilibrium constant', 'Reaction quotient', "Le Chatelier's principle", 'ICE tables', 'Solubility equilibria'],
    },
    {
      title: 'Acids & Bases',
      blurb: 'Protons on the move.',
      topics: ['pH and pOH', 'Strong acids and bases', 'Weak acid equilibria', 'Buffers', 'Titration curves', 'Molecular structure and acidity'],
    },
    {
      title: 'Applications of Thermodynamics',
      blurb: 'Entropy, free energy, and cells.',
      topics: ['Entropy', 'Gibbs free energy', 'Thermodynamic favorability', 'Coupled reactions', 'Electrochemical cells', 'Electrolysis'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Multiple-choice strategy', 'Long free response', 'Short free response', 'Lab-based questions', 'Justifying with particles', 'Full timed practice'],
    },
  ],
  'ap-psych': [
    {
      title: 'Biological Bases of Behavior',
      blurb: 'The biology under every thought.',
      topics: ['Neurons and signals', 'Neurotransmitters', 'The nervous system', 'Brain structures', 'Studying the brain', 'Sleep and consciousness'],
    },
    {
      title: 'Sensation & Perception',
      blurb: 'Turning signals into a world.',
      topics: ['Thresholds and adaptation', 'Vision', 'Hearing', 'The other senses', 'Perceptual organization', 'Perceptual interpretation'],
    },
    {
      title: 'Learning',
      blurb: 'How experience changes behavior.',
      topics: ['Classical conditioning', 'Acquisition and extinction', 'Operant conditioning', 'Reinforcement schedules', 'Observational learning', 'Biological constraints'],
    },
    {
      title: 'Cognition & Memory',
      blurb: 'Taking in, holding on, using it.',
      topics: ['Encoding', 'Memory storage', 'Retrieval', 'Forgetting', 'Thinking and problem solving', 'Judgment and bias'],
    },
    {
      title: 'Motivation & Emotion',
      blurb: 'What moves people to act.',
      topics: ['Theories of motivation', 'Hunger and eating', 'Social motivation', 'Theories of emotion', 'Expressing emotion', 'Stress and health'],
    },
    {
      title: 'Developmental Psychology',
      blurb: 'People across a whole lifetime.',
      topics: ['Research methods in development', 'Physical development', 'Cognitive development', 'Attachment', 'Adolescence', 'Adulthood and aging'],
    },
    {
      title: 'Personality',
      blurb: 'What makes someone consistently them.',
      topics: ['Psychodynamic theories', 'Humanistic theories', 'Trait theories', 'Social-cognitive theories', 'Assessing personality', 'The self'],
    },
    {
      title: 'Clinical Psychology',
      blurb: 'Diagnosis, disorder, and treatment.',
      topics: ['Defining disorder', 'Anxiety disorders', 'Mood disorders', 'Schizophrenia', 'Psychological therapies', 'Biomedical therapies'],
    },
    {
      title: 'Social Psychology',
      blurb: 'People in the presence of people.',
      topics: ['Attribution', 'Attitudes and actions', 'Conformity and obedience', 'Group behavior', 'Prejudice and aggression', 'Attraction and altruism'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Multiple-choice strategy', 'Research design questions', 'Article analysis', 'Evidence-based questions', 'Applying concepts', 'Full timed practice'],
    },
  ],
  'ap-eng-lang': [
    {
      title: 'Rhetorical Situation: Reading',
      blurb: 'Seeing the moves a writer makes.',
      topics: ['Identifying the exigence', 'Audience and purpose', 'Speaker and persona', 'Context and occasion', 'Rhetorical appeals', 'Annotating a text'],
    },
    {
      title: 'Rhetorical Situation: Writing',
      blurb: 'Writing for a real reader.',
      topics: ['Choosing your purpose', 'Writing for an audience', 'Establishing persona', 'Selecting appeals', 'Framing an introduction', 'Controlling tone'],
    },
    {
      title: 'Claims & Evidence: Reading',
      blurb: 'What is being argued, and on what.',
      topics: ['Locating the claim', 'Types of evidence', 'Evaluating evidence', 'Implicit claims', 'Qualifying claims', 'Bias and credibility'],
    },
    {
      title: 'Claims & Evidence: Writing',
      blurb: 'Claims that actually hold weight.',
      topics: ['Writing a defensible thesis', 'Choosing evidence', 'Integrating quotations', 'Writing commentary', 'Qualifying your position', 'Addressing counterargument'],
    },
    {
      title: 'Reasoning & Organization',
      blurb: 'The shape an argument takes.',
      topics: ['Lines of reasoning', 'Paragraph structure', 'Transitions', 'Methods of development', 'Concessions and rebuttal', 'Conclusions that land'],
    },
    {
      title: 'Style: Reading',
      blurb: 'Why the sentence sounds like that.',
      topics: ['Diction', 'Syntax and sentence length', 'Figurative language', 'Imagery', 'Irony and understatement', 'Shifts in tone'],
    },
    {
      title: 'Style: Writing',
      blurb: 'Making your own prose do work.',
      topics: ['Precise word choice', 'Sentence variety', 'Coordination and subordination', 'Rhetorical devices', 'Cutting wordiness', 'Revision moves'],
    },
    {
      title: 'Synthesis Argument',
      blurb: 'Many sources, one clear voice.',
      topics: ['Reading a source set', 'Finding the conversation', 'Taking a position', 'Citing sources', 'Synthesizing not summarizing', 'Building the essay'],
    },
    {
      title: 'Rhetorical Analysis',
      blurb: 'Explaining how a text works.',
      topics: ['Analysis versus summary', 'Choosing what to analyze', 'Writing about effect', 'Structuring the analysis', 'Sophistication points', 'Common pitfalls'],
    },
    {
      title: 'Exam Preparation',
      blurb: 'Everything, under a clock.',
      topics: ['Multiple-choice reading', 'Multiple-choice writing', 'Synthesis essay timing', 'Rhetorical analysis timing', 'Argument essay timing', 'Full timed practice'],
    },
  ],
};

/** Courses fall back to AP Biology's shape if they have no dedicated units. */
export const DEFAULT_UNITS: UnitSpec[] = COURSE_UNITS['ap-biology'];
