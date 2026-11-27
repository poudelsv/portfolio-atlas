const sapoFaq = [
  {
    label: 'Roles and availability',
    patterns: [
      /\b(?:when (?:can|could|would) (?:you|saurav|he) (?:start|join|begin)|(?:your|his|saurav['’]s) start date|available to (?:start|work))\b/i,
      /\b(?:what (?:roles|jobs|positions) (?:are (?:you|he) looking for|do you want|is saurav looking for)|target roles|what are you looking for)\b/i,
    ],
    answer: 'Saurav is looking for full-time roles in data engineering, software development, or applied AI. He is available to start in May 2027.',
  },
  {
    label: 'Education',
    patterns: [
      /\b(?:when (?:do you|does saurav|does he) graduate|(?:your|his|saurav['’]s) (?:graduation date|degree|education)|where (?:do you|does saurav|does he) (?:study|go to school)|what (?:do you|does saurav|does he) study)\b/i,
    ],
    answer: 'Saurav is completing a B.S. in Information Technology at the University of Cincinnati, with a focus on AI, data science, and software engineering. His expected graduation is May 2027.',
  },
  {
    label: 'Experience overview',
    patterns: [
      /\b(?:where (?:have you|has saurav|has he) worked|(?:your|his|saurav['’]s) (?:professional|work|co-op) experience|tell me about (?:your|his|saurav['’]s) career)\b/i,
    ],
    answer: 'At Delta Air Lines, Saurav worked on safety data pipelines, fleet telematics, and incident workflows. At the University of Cincinnati, his work includes clinical license verification and VR simulation for the College of Nursing, plus backend development for the IT Solution Center.',
  },
  {
    label: 'Salesforce Catering Connect',
    patterns: [/\b(?:salesforce catering connect|catering connect)\b/i],
    answer: 'Saurav helped build a Salesforce workflow for incident intake, ownership, and follow-up at Delta Air Lines with IBM and at least 15 cross-functional teams. The portfolio records a 50% increase in case throughput. A separate Agentforce sandbox prototype suggested categories, flagged missing information, and drafted escalation notes.',
  },
  {
    label: 'Newrest collaboration',
    patterns: [/\b(?:work(?:ed)? with newrest|collaborat(?:e|ed|ion) with newrest|newrest collaboration)\b/i],
    answer: 'Newrest is listed among the companies Saurav collaborated with. The résumé’s collaborator section lists the other organizations.',
  },
  {
    label: 'TechOps AOG Command Center',
    patterns: [
      /\b(?:techops (?:aog|aircraft[- ]on[- ]ground)|aog (?:risk )?command center|aircraft[- ]on[- ]ground risk command center)\b/i,
      /\b(?:how (?:did you|did he|did saurav) use foundry|what (?:have you|has he|has saurav) built (?:in|with) (?:palantir )?foundry)\b/i,
    ],
    answer: 'Saurav built a Palantir Foundry prototype that links aircraft, maintenance events, stations, work orders, and parts. The prototype unified at least five data sources across at least ten stations. Its Workshop view exposes supporting records, and AIP Logic drafts handoff briefs with work-order IDs and flags for missing evidence.',
  },
  {
    label: 'SupplySmart',
    patterns: [/\bsupply\s*smart\b/i],
    answer: 'Saurav contributed inventory forecasting to the team-built SupplySmart application. The feature uses live storage records to estimate future inventory and suggest reorder quantities. His portfolio benchmark compares seasonal naïve, moving-average, exponential-smoothing, and gradient-boosted forecasts using rolling test windows.',
  },
  {
    label: 'PreceptorVerify',
    patterns: [/\bpreceptor\s*verify\b/i, /\b(?:clinical preceptor|provider) license (?:verification|review) (?:project|pipeline|app)\b/i],
    answer: 'Saurav built an internal license-review pipeline that the portfolio records as covering at least 50,000 provider records from 12 state databases. It uses Airflow, dbt, Great Expectations, PostgreSQL, and FastAPI. The public app directs reviewers to official licensing boards and records their checks. LangChain and pgvector retrieval were explored in a separate prototype.',
  },
  {
    label: 'Ohio Risk Assessment System',
    patterns: [/\b(?:ohio risk assessment(?: system)?|oras)\b/i],
    answer: 'Saurav implemented forms, record management, search, and filters with React, Express, PostgreSQL, and Sequelize. His IT Solution Center résumé entry describes the wider risk-assessment platform as serving at least 10,000 active users across at least ten states.',
  },
  {
    label: 'Lytx fleet telematics',
    patterns: [/\b(?:lytx|fleet telematics|station risk profile)\b/i],
    answer: 'Saurav built the department’s first Lytx integration at Delta Air Lines. It used Python and REST APIs to normalize at least 30,000 fleet safety events in PostgreSQL. The portfolio reports a 65% reduction in manual data preparation. A station risk profile combined the telematics with audit and incident records.',
  },
  {
    label: 'Ramp safety reporting',
    patterns: [/\b(?:airport ramp safety|ramp safety data pipelines|ramp safety reporting)\b/i],
    answer: 'Saurav built and validated Delta Air Lines reporting pipelines with Python, PostgreSQL, AWS Lambda, and AWS Glue. The portfolio records at least 30 datasets brought together and a 47% reduction in manual reporting.',
  },
  {
    label: 'Clinical VR simulation',
    patterns: [/\b(?:clinical (?:skills )?vr|nursing (?:vr|simulation)|clinical training simulations|headset deployment)\b/i],
    answer: 'Saurav developed clinical training scenarios in Unity and C# at the University of Cincinnati College of Nursing. He tested on Meta Quest headsets and deployed builds through ArborXR. The portfolio records at least 200 nursing students served and at least 30 headsets managed.',
  },
  {
    label: 'Cloud automation examples',
    patterns: [
      /\b(?:ai[- ]native development\s*(?:and|&)\s*cloud automation|cloud automation (?:demos|portfolio|project))\b/i,
      /\b(?:what (?:have you|has saurav|has he) built (?:with|on) (?:cloud run|bigquery|bedrock)|(?:your|his|saurav['’]s) mcp (?:service|demo))\b/i,
    ],
    answer: 'Saurav’s cloud demos include a read-only MCP service on Cloud Run that exposes approved BigQuery metrics, and an AWS flow that validates vendor audit files and drafts summaries with links to source records. GitHub Actions runs data tests, API checks, and agent evaluations.',
  },
  {
    label: 'Finance and pricing',
    patterns: [/\b(?:geospatial (?:dynamic )?pricing|dynamic pricing (?:project|implementation)|vendor damage (?:cost|forecasting))\b/i],
    answer: 'The portfolio includes two finance examples. At Delta Air Lines, Saurav linked safety audits and ramp incidents to damage costs to estimate exposure. His separate geospatial pricing implementation models demand and margin by market and evaluates pricing scenarios. The portfolio describes evaluation plans for the pricing implementation.',
  },
  {
    label: 'Technical skills',
    patterns: [
      /\b(?:what (?:programming languages|technical skills|tools) (?:do you|does saurav|does he) (?:have|use|know)|(?:your|his|saurav['’]s) (?:tech stack|technical skills|programming languages))\b/i,
    ],
    answer: 'Saurav uses Python and SQL for data work, JavaScript and TypeScript for web applications, and C# for Unity simulation. Portfolio examples also use PostgreSQL, Airflow, dbt, AWS, React, Node.js, Tableau, and Power BI.',
  },
  {
    label: 'Applied AI work',
    patterns: [
      /\b(?:what (?:ai|machine learning) (?:work|projects) (?:have you|has saurav|has he) (?:done|built)|(?:your|his|saurav['’]s) (?:applied )?ai (?:work|projects|experience)|examples of saurav['’]s ai work)\b/i,
    ],
    answer: 'Saurav’s applied AI examples include a Salesforce sandbox that suggests incident categories, a Foundry prototype that drafts maintenance handoffs with evidence, and a PreceptorVerify retrieval prototype. The portfolio distinguishes these prototypes from deployed workflows.',
  },
  {
    label: 'Creative projects',
    patterns: [
      /\b(?:creative projects|creative work|creative portfolio|photography portfolio|poster collection|(?:your|his|saurav['’]s) (?:photography|videography|graphic design|3d work)|behance)\b/i,
    ],
    answer: 'The Creative Projects section covers photography, videography, graphic design, and 3D modeling and animation. It links to Saurav’s Behance collections, including Photography, Social Media & Cinematography, and Poster / Graphic Design, and credits the reference material used in the visual studies.',
  },
  {
    label: 'Certifications',
    patterns: [
      /\b(?:what certifications? (?:do you|does saurav|does he) have|(?:your|his|saurav['’]s) certifications?|(?:are you|is saurav|is he) (?:salesforce|agentforce) certified)\b/i,
    ],
    answer: 'Saurav lists the Salesforce Certified Agentforce Specialist credential, a Delta Air Lines Six Sigma Lean White Belt, and Neo4j Fundamentals. The Salesforce credential links to his Trailblazer profile in the résumé’s Certifications section.',
  },
  {
    label: 'Relocation',
    patterns: [/\b(?:open to relocat(?:e|ion)|willing to relocate|would (?:you|saurav|he) relocate|where (?:can|could) (?:you|saurav|he) work)\b/i],
    answer: 'Saurav is open to relocating anywhere in the United States for a full-time role.',
  },
  {
    label: 'GitHub and project code',
    patterns: [
      /\b(?:(?:your|his|saurav['’]s) github(?: profile| account| repos?| repositories)?|where (?:can i|do i) (?:find|see) (?:your|his|saurav['’]s|the) (?:code|repositories|source code)|(?:view|see|find) (?:your|his) github)\b/i,
    ],
    answer: 'Open GitHub from the Contact panel or use the repository links in Projects. PreceptorVerify and SupplySmart have repository links in their project entries.',
  },
];
