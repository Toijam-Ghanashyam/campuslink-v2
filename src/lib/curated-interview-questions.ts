/**
 * Curated Company-Specific & Role-Specific Technical Interview Questions
 * Tailored to match the exact hiring bar, engineering domain, and job descriptions of campus placement partners.
 */

export interface CuratedInterviewQuestion {
  id: number;
  questionNumber: number;
  category: string;
  prompt: string;
  companyFocus: string;
  idealKeywords: string[];
  sampleAnswer: string;
}

// 1. Google - Software Development Engineer
export const GOOGLE_SDE_QUESTIONS: CuratedInterviewQuestion[] = [
  {
    id: 1,
    questionNumber: 1,
    category: 'Google Systems & Architecture',
    prompt:
      'Walk us through the most technically complex software system you have architected at BPUT. How did you design for low latency, fault tolerance, and clean modular boundaries relevant to Google-scale software development?',
    companyFocus: 'Evaluates architectural clarity, system complexity, and experience designing resilient backend components.',
    idealKeywords: ['Latency', 'Microservices', 'Concurrency', 'Asynchronous I/O', 'Fault Tolerance', 'Modularity'],
    sampleAnswer:
      'I am an engineering senior at BPUT with a focus on scalable systems and low-latency services. My most technically rigorous project was an automated campus placement dispatch system. I architected the service with Node.js and PostgreSQL using optimistic concurrency control to prevent double-booking across 1,500 students. I separated read-heavy catalog queries from write transactions using Redis caching, and integrated WebSocket feeds for sub-100ms real-time panel updates.',
  },
  {
    id: 2,
    questionNumber: 2,
    category: 'Data Structures & Algorithmic Complexity',
    prompt:
      'In a high-throughput Google service handling billions of queries, how would you design an in-memory LRU Cache with strict O(1) time complexity for both get and put operations? Explain the underlying pointer manipulation and eviction policy.',
    companyFocus: 'Assesses foundational computer science mastery, Big-O algorithmic limits, and pointer-level data structure design.',
    idealKeywords: ['Doubly Linked List', 'Hash Map', 'O(1) Get/Put', 'Node Eviction', 'Head/Tail Pointers'],
    sampleAnswer:
      'To guarantee strict O(1) time complexity for both get and put operations, I pair a doubly linked list with a hash map. The hash map maps cache keys to pointers of nodes in the doubly linked list. When a key is accessed or added, the corresponding node is unlinked and spliced to the head of the list in O(1). When capacity is exceeded, the least recently used node is evicted from the tail in O(1) and purged from the hash map.',
  },
  {
    id: 3,
    questionNumber: 3,
    category: 'Distributed Systems & Concurrency',
    prompt:
      'How does Google ensure data consistency across globally distributed storage systems like Spanner or Bigtable? How would you manage concurrent write conflicts without bottlenecking distributed transaction throughput?',
    companyFocus: 'Evaluates understanding of distributed consistency models, vector clocks / TrueTime, and two-phase locking.',
    idealKeywords: ['TrueTime', 'Two-Phase Commit', 'Paxos / Raft', 'Serializable Isolation', 'Optimistic Locking'],
    sampleAnswer:
      'Google achieves external consistency at global scale in Spanner using TrueTime API, which leverages synchronized atomic clocks and GPS receivers to assign monotonically increasing commit timestamps. For concurrent write conflicts, Spanner employs multi-version concurrency control (MVCC) paired with two-phase locking and Paxos consensus. In my own designs, I minimize write contention by partitioning data across deterministic shard keys and using optimistic locking with lease TTLs in Redis.',
  },
  {
    id: 4,
    questionNumber: 4,
    category: 'Database Systems & Query Optimization',
    prompt:
      'When would you choose a B-Tree composite index over a Hash index in PostgreSQL or Spanner, and how do you diagnose and eliminate an unindexed sequential scan causing high disk I/O in production?',
    companyFocus: 'Tests deep knowledge of storage engines, index layout (leftmost prefix rule), and query execution plan analysis.',
    idealKeywords: ['B-Tree vs Hash', 'Leftmost Prefix', 'EXPLAIN ANALYZE', 'Sequential Scan', 'Disk Page Fetch'],
    sampleAnswer:
      'A composite B-Tree index is mandatory when queries filter or sort across multiple columns following the leftmost prefix rule, or perform range queries with inequalities. Hash indices only support equality lookups and cannot optimize range scans or ORDER BY clauses. To diagnose a slow query, I inspect the execution plan using EXPLAIN ANALYZE, identifying sequential table scans, excessive disk page fetches, and row estimation miscalculations, and add partial or covering indexes.',
  },
  {
    id: 5,
    questionNumber: 5,
    category: 'High-Scale System Design',
    prompt:
      'Design a real-time, conflict-free interview and drive slot reservation service that handles 100,000 concurrent student requests during campus drive-day rush. Walk us through your caching, distributed locking, and database write pipeline.',
    companyFocus: 'Examines end-to-end system design skills, rate limiting, distributed locking (Redlock), and event-driven architecture.',
    idealKeywords: ['Redis Distributed Lock', 'Lua Scripts', 'Apache Kafka', 'Event-Driven Saga', 'Unique Constraint'],
    sampleAnswer:
      'For 100,000 concurrent requests, I would employ an event-driven architecture fronted by an API gateway with token-bucket rate limiting. When a candidate attempts to book a slot, an atomic Redis Lua script checks availability and acquires a distributed reservation lease with a 5-minute TTL. Once validated, an event is published to Apache Kafka, and a background consumer batches write transactions into PostgreSQL with unique constraints on (interviewer_id, timeslot) to guarantee zero double-bookings.',
  },
];

// 2. Infosys Limited - Data Analyst / Data Scientist
export const INFOSYS_DATA_QUESTIONS: CuratedInterviewQuestion[] = [
  {
    id: 1,
    questionNumber: 1,
    category: 'Data Analytics & ETL Pipelines',
    prompt:
      'Walk us through an end-to-end data analytics or machine learning pipeline you built. How did you handle data ingestion, missing values, anomaly detection, and preparing clean feature matrices for business stakeholder reporting?',
    companyFocus: 'Assesses practical data cleaning, feature engineering, and translating raw data into business intelligence.',
    idealKeywords: ['ETL Pipeline', 'Missing Values / Imputation', 'Outlier Detection', 'Feature Scaling', 'BI Reporting'],
    sampleAnswer:
      'In my analytics project at BPUT, I built an end-to-end student performance and placement readiness pipeline. I ingested raw academic records, proctoring telemetry, and assessment logs across 2,000 students. For missing records, I applied domain-specific median imputation and eliminated multi-collinear attributes. I developed an automated anomaly detection script using Z-scores and IQR to flag skewed scores, and piped the cleaned data into interactive dashboards for placement officers.',
  },
  {
    id: 2,
    questionNumber: 2,
    category: 'Advanced SQL & Relational Queries',
    prompt:
      'In SQL, how do window functions like ROW_NUMBER(), RANK(), and DENSE_RANK() differ? Provide an example of how you would write a query to find the top 3 highest-performing students per engineering branch.',
    companyFocus: 'Tests core relational querying depth, analytical functions, and data aggregation for enterprise reporting.',
    idealKeywords: ['ROW_NUMBER vs DENSE_RANK', 'PARTITION BY', 'ORDER BY', 'Subquery / CTE', 'Analytical SQL'],
    sampleAnswer:
      'ROW_NUMBER() assigns a unique sequential integer to each row without gaps. RANK() assigns identical ranks to ties but skips subsequent rank numbers. DENSE_RANK() assigns identical ranks to ties without skipping subsequent integers. To find the top 3 highest-performing students per branch, I write a Common Table Expression using DENSE_RANK() OVER (PARTITION BY branch ORDER BY verified_cgpa DESC) as rnk, and then query the CTE where rnk <= 3.',
  },
  {
    id: 3,
    questionNumber: 3,
    category: 'Data Modeling & Enterprise Warehousing',
    prompt:
      'Compare a Star Schema with a Snowflake Schema in enterprise data warehousing. How do you design dimension and fact tables to support high-speed analytical querying across years of placement and hiring trends at Infosys?',
    companyFocus: 'Evaluates understanding of dimensional data modeling, normalization tradeoffs, and analytical data marts.',
    idealKeywords: ['Fact vs Dimension', 'Star Schema', 'Snowflake Schema', 'Denormalization', 'Slowly Changing Dimensions'],
    sampleAnswer:
      'A Star schema connects a central fact table directly to denormalized dimension tables, optimizing for fast aggregations and simple analytical queries. A Snowflake schema normalizes dimension tables into sub-dimensions to eliminate redundancy at the cost of additional JOIN complexity. For Infosys placement trends, I design a central Placement_Facts table with foreign keys to Student_Dim, Company_Dim, and Time_Dim, using Star schema denormalization for sub-second executive dashboard queries.',
  },
  {
    id: 4,
    questionNumber: 4,
    category: 'Python for Data Analysis & Pandas',
    prompt:
      'Why are vectorized operations in NumPy and Pandas exponentially faster than standard Python for-loops? Explain how memory strides and C-contiguous arrays optimize dataframe aggregations.',
    companyFocus: 'Tests technical depth in Python analytical libraries, vectorized computing, and memory alignment.',
    idealKeywords: ['Vectorization', 'SIMD', 'NumPy ndarray', 'Memory Locality', 'Pandas apply vs Vectorized'],
    sampleAnswer:
      'Vectorized operations in NumPy and Pandas execute at the compiled C/Fortran level utilizing SIMD (Single Instruction, Multiple Data) CPU instructions and continuous memory strides. Standard Python for-loops incur dynamic type-checking overhead and reference-pointer indirection on every single iteration. Vectorized operations execute operations on uniform memory buffers in a single hardware cycle, delivering 50x to 100x speedups on large dataframes.',
  },
  {
    id: 5,
    questionNumber: 5,
    category: 'Real-Time Analytics Dashboard Architecture',
    prompt:
      'Design a real-time data streaming and analytics pipeline that aggregates live student interview results, test scores, and recruiter offers during a 10,000-candidate campus hiring drive. How do you ensure dashboard metrics update without overloading the database?',
    companyFocus: 'Assesses system design for analytics, message queues, and streaming aggregation.',
    idealKeywords: ['Stream Processing', 'Kafka / Redis PubSub', 'Materialized Views', 'Read Replica', 'WebSockets'],
    sampleAnswer:
      'I would architect a streaming pipeline using Apache Kafka or Redis Pub/Sub for event ingestion. As interview results and offers are submitted, events are pushed to an ingestion topic. A stream worker aggregates key metrics (offer counts, branch clearances, average CTC) in memory and caches materialized metrics in Redis. The frontend dashboards subscribe to a WebSocket server reading from Redis cache, completely decoupling dashboard polling from transactional OLTP database writes.',
  },
];

// 3. Microsoft India - Cloud & AI SDE
export const MICROSOFT_CLOUD_QUESTIONS: CuratedInterviewQuestion[] = [
  {
    id: 1,
    questionNumber: 1,
    category: 'Cloud-Native Architecture & Microservices',
    prompt:
      'Describe how you design cloud-native microservices on Azure or Kubernetes. How do you implement resilience patterns such as Circuit Breakers, Bulkheads, and Exponential Backoff with Jitter for external service dependencies?',
    companyFocus: 'Tests cloud architecture, distributed fault tolerance, and Microsoft Azure engineering practices.',
    idealKeywords: ['Circuit Breaker', 'Polly / Resilience', 'Bulkhead', 'Exponential Backoff with Jitter', 'Kubernetes'],
    sampleAnswer:
      'In cloud-native systems, cascading failures occur when downstream services become unresponsive. I implement the Circuit Breaker pattern to trip open after a threshold of failures, failing fast rather than exhausting thread pools. For transient network glitches, I configure exponential backoff with randomized jitter to prevent thundering herd retries. Bulkhead isolation partitions thread and connection pools so one failing downstream dependency cannot starve unrelated endpoints.',
  },
  {
    id: 2,
    questionNumber: 2,
    category: 'Concurrency & Multithreading',
    prompt:
      'How do asynchronous runtimes handle high concurrent I/O without thread pool exhaustion? Explain how you prevent race conditions, deadlocks, and memory starvation in multi-threaded backend services.',
    companyFocus: 'Evaluates systems programming, thread synchronization, deadlocks, and asynchronous task management.',
    idealKeywords: ['Thread Pool', 'Async/Await Task', 'Deadlock Prevention', 'Mutex / Lock Hierarchy', 'Non-blocking I/O'],
    sampleAnswer:
      'Asynchronous runtimes use non-blocking event loops and I/O completion ports, allowing a small fixed pool of worker threads to handle thousands of concurrent requests by suspending tasks at await boundaries rather than blocking OS threads. To eliminate deadlocks, I establish strict hierarchical lock ordering and acquire multiple locks atomically. I also minimize lock holding times and use immutable data structures or concurrent collections.',
  },
  {
    id: 3,
    questionNumber: 3,
    category: 'Distributed Caching & Invalidation',
    prompt:
      'How would you architect a multi-tiered distributed caching strategy with Redis on Azure to handle 50,000 requests/sec? How do you prevent cache stampede (thundering herd) and manage cache invalidation?',
    companyFocus: 'Tests caching patterns, cache stampede mitigation, and cache-aside vs write-through architecture.',
    idealKeywords: ['Cache Stampede', 'Mutex Lock on Cache Miss', 'Probabilistic Early Expiration', 'Cache-Aside', 'Redis TTL'],
    sampleAnswer:
      'I use a Cache-Aside pattern with Redis backed by read replicas. To eliminate cache stampede when a hot key expires, I implement distributed mutex locking: only the first thread that experiences a cache miss acquires a Redis lock to query the database and rebuild the cache, while other threads wait briefly or receive a stale-while-revalidate cached value. I also use probabilistic early expiration (XFetch algorithm) to refresh keys before hard expiration.',
  },
  {
    id: 4,
    questionNumber: 4,
    category: 'Distributed Storage & Cosmos DB',
    prompt:
      'In globally distributed databases like Azure Cosmos DB, explain the trade-offs between Strong, Bounded Staleness, Session, and Eventual consistency. Which consistency level would you choose for an interview scheduling service and why?',
    companyFocus: 'Examines PACELC/CAP theorem, consistency levels, and database latency vs correctness trade-offs.',
    idealKeywords: ['Cosmos DB Consistency', 'Session vs Bounded Staleness', 'CAP Theorem', 'Read Latency vs Accuracy'],
    sampleAnswer:
      'Strong consistency guarantees linearizability and monotonic reads across all regions, but incurs highest latency and reduced write availability under network partitions. Eventual consistency offers maximum availability and lowest latency with no ordering guarantees. For interview scheduling, I select Session consistency for the candidate—guaranteeing monotonic read-your-own-writes—and Bounded Staleness for recruiter dashboards, ensuring updates lag by no more than a few seconds while preserving high throughput.',
  },
  {
    id: 5,
    questionNumber: 5,
    category: 'High-Scale Cloud Storage & Processing Pipeline',
    prompt:
      'Design a secure, highly scalable service for processing and transcribing 20,000 candidate video interviews uploaded simultaneously during campus placement. Walk us through blob upload, asynchronous queueing, and transcription dispatch.',
    companyFocus: 'Assesses cloud systems design, pre-signed upload URLs, asynchronous event processing, and AI dispatch.',
    idealKeywords: ['Direct Blob Upload (SAS / Pre-signed URL)', 'Azure Queue / Service Bus', 'Worker Service', 'AI Transcription API'],
    sampleAnswer:
      'To prevent video uploads from passing through web servers, the API issues short-lived pre-signed SAS URLs, allowing clients to stream video directly into Azure Blob Storage. When an upload completes, an Azure Event Grid notification triggers an Azure Service Bus queue message. A decoupled pool of autoscaling worker containers dequeues tasks, calls the Whisper transcription inference endpoint, and saves transcripts to the database with retry dead-letter queues.',
  },
];

// 4. TCS / Infosys - Systems Engineer / Specialist Programmer
export const TCS_SYSTEMS_QUESTIONS: CuratedInterviewQuestion[] = [
  {
    id: 1,
    questionNumber: 1,
    category: 'Software Engineering & Clean Architecture',
    prompt:
      'Explain how Object-Oriented Design Principles (SOLID) and clean architecture help maintain large enterprise applications across multi-year software releases. Give an example from a system you developed.',
    companyFocus: 'Evaluates software engineering maturity, design patterns, and maintainable enterprise coding standards.',
    idealKeywords: ['SOLID Principles', 'Dependency Inversion', 'Clean Architecture', 'Separation of Concerns'],
    sampleAnswer:
      'SOLID principles ensure software is extensible and resilient to change. In my placement portal project, I applied Dependency Inversion by depending on abstract repository interfaces rather than concrete database clients. When migrating from SQLite to PostgreSQL, I only swapped the repository implementation without altering business domain logic. Single Responsibility ensured each controller handles one business operation, making unit testing straightforward.',
  },
  {
    id: 2,
    questionNumber: 2,
    category: 'Data Structures & Problem Solving',
    prompt:
      'Explain how you would find the longest substring without repeating characters in O(n) time complexity. Walk us through your algorithm using the sliding window technique and hash set/map.',
    companyFocus: 'Tests algorithmic foundations, sliding window technique, and time/space complexity optimization.',
    idealKeywords: ['Sliding Window', 'Two Pointers', 'Hash Map / Set', 'O(n) Time Complexity', 'O(k) Space'],
    sampleAnswer:
      'I use a sliding window with two pointers (left and right) and a hash map storing the last seen index of each character. As the right pointer advances, if a character is already present and its index is greater than or equal to the left pointer, I jump the left pointer to index + 1. The maximum window length (right - left + 1) is tracked at each step. This processes each character at most twice, achieving strict O(n) time complexity.',
  },
  {
    id: 3,
    questionNumber: 3,
    category: 'REST API Design & Web Security',
    prompt:
      'What are the core principles of designing RESTful APIs, and how do you protect web services against common vulnerabilities like SQL Injection, Cross-Site Scripting (XSS), and Cross-Site Request Forgery (CSRF)?',
    companyFocus: 'Tests API best practices, HTTP verbs/status codes, and OWASP web application security.',
    idealKeywords: ['Parameterized Queries', 'HTTP Verbs (GET/POST/PUT/DELETE)', 'Sanitization / Escaping', 'CSRF Tokens', 'SameSite Cookies'],
    sampleAnswer:
      'A RESTful API uses standard HTTP verbs, stateless requests, and descriptive JSON payloads with correct HTTP status codes (200, 201, 400, 401, 404, 500). To prevent SQL injection, I exclusively use parameterized queries and ORMs. To mitigate XSS, I sanitize user inputs and utilize React auto-escaping and Content-Security-Policy headers. For CSRF protection, I enforce SameSite=Strict cookies paired with anti-CSRF challenge tokens for state-modifying requests.',
  },
  {
    id: 4,
    questionNumber: 4,
    category: 'Database Normalization & Indexing',
    prompt:
      'Explain the difference between 2NF and 3NF database normalization. When is deliberate denormalization justified in high-traffic enterprise applications?',
    companyFocus: 'Evaluates relational database design, anomaly prevention, and read performance optimization.',
    idealKeywords: ['2NF vs 3NF', 'Transitive Dependency', 'Denormalization', 'Read Optimization', 'Data Integrity'],
    sampleAnswer:
      'A table is in 2NF if it is in 1NF and all non-key attributes are fully dependent on the primary key. It reaches 3NF when it has no transitive functional dependencies (non-key attributes dependent on other non-key attributes). While 3NF eliminates update and deletion anomalies, deliberate denormalization is justified in read-heavy enterprise reporting dashboards where JOIN overhead across 6 normalized tables creates unacceptable query latency.',
  },
  {
    id: 5,
    questionNumber: 5,
    category: 'High-Concurrency Campus Portal Architecture',
    prompt:
      'Design a reliable campus placement portal that handles 15,000 simultaneous student registrations during the first 10 minutes of a Tier-1 recruitment drive without crashing or dropping submissions.',
    companyFocus: 'Tests practical system design, graceful degradation, message queues, and horizontal autoscaling.',
    idealKeywords: ['Horizontal Autoscaling', 'Load Balancer', 'Message Queue Buffering', 'Redis Rate Limiter', 'Database Connection Pooling'],
    sampleAnswer:
      'I would deploy stateless application servers behind an Nginx or cloud load balancer with auto-scaling groups. To prevent database connection exhaustion, incoming registration payloads are immediately written to an asynchronous queue (RabbitMQ/Redis) and acknowledged with HTTP 202 Accepted. Background worker processes consume from the queue at a controlled throughput, inserting records into PostgreSQL using connection pooling (PgBouncer) to guarantee zero dropped registrations.',
  },
];

// Helper: Match company & role to curated questions
export function getCuratedQuestionsForCompany(
  companyName: string = '',
  roleTitle: string = '',
  jobDescription: string = ''
): CuratedInterviewQuestion[] {
  const comp = (companyName || '').toLowerCase();
  const role = (roleTitle || '').toLowerCase();
  const desc = (jobDescription || '').toLowerCase();

  // 1. Google or high-tier SDE
  if (comp.includes('google') || (role.includes('software') && desc.includes('distributed'))) {
    return GOOGLE_SDE_QUESTIONS;
  }

  // 2. Microsoft or Cloud / DevOps
  if (comp.includes('microsoft') || desc.includes('azure') || role.includes('cloud')) {
    return MICROSOFT_CLOUD_QUESTIONS;
  }

  // 3. Infosys Data Analyst / Data Science
  if (
    comp.includes('infosys') &&
    (role.includes('data') || role.includes('analyst') || role.includes('scientist') || desc.includes('analytics'))
  ) {
    return INFOSYS_DATA_QUESTIONS;
  }

  // 4. Amazon / Atlassian
  if (comp.includes('amazon') || comp.includes('atlassian')) {
    return GOOGLE_SDE_QUESTIONS; // High-scale distributed systems set
  }

  // 5. TCS, Cognizant, Generic Systems Engineer
  if (comp.includes('tcs') || comp.includes('cognizant') || role.includes('systems') || role.includes('engineer')) {
    return TCS_SYSTEMS_QUESTIONS;
  }

  // Default to Google SDE (rigorous engineering standard)
  return GOOGLE_SDE_QUESTIONS;
}

