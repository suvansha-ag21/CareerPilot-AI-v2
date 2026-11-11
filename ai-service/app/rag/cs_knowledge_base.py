from typing import Dict, List

CS_KB_DOCUMENTS: List[Dict[str, str]] = [
    # 1. DSA
    {
        "id": "dsa_complexity_hashing",
        "topic": "DSA",
        "subtopic": "Hashing, Two Pointers & Sliding Window",
        "content": (
            "Arrays and hash maps trade O(n) extra space to reduce O(n^2) nested lookups to O(n) amortized time. "
            "Hash collisions degrade worst-case lookup to O(n) without balanced buckets or good hash dispersion. "
            "Two-pointer and sliding-window patterns maintain contiguous invariants over sorted arrays or strings in O(n) time and O(1) auxiliary space."
        ),
    },
    {
        "id": "dsa_trees_graphs_dp",
        "topic": "DSA",
        "subtopic": "Trees, Graphs, Heaps & Dynamic Programming",
        "content": (
            "BFS uses a FIFO queue to find unweighted shortest paths in O(V+E), while DFS tracks recursion/visited sets for cycle detection and topological sort. "
            "Dijkstra handles non-negative weighted graphs in O((V+E) log V) with a min-heap. "
            "Dynamic Programming optimizes overlapping subproblems with optimal substructure via memoization or bottom-up state transitions."
        ),
    },
    # 2. DBMS
    {
        "id": "dbms_acid_isolation",
        "topic": "DBMS",
        "subtopic": "ACID, Transactions & Isolation Levels",
        "content": (
            "ACID guarantees Atomicity (all-or-nothing via WAL undo/redo logs), Consistency, Isolation, and Durability. "
            "SQL isolation levels prevent anomalies progressively: Read Committed prevents dirty reads; Repeatable Read prevents non-repeatable reads; Serializable prevents phantom reads. "
            "PostgreSQL uses MVCC (Multi-Version Concurrency Control) so readers never block writers."
        ),
    },
    {
        "id": "dbms_indexing_normalization",
        "topic": "DBMS",
        "subtopic": "Normalization & B+ Tree Indexing",
        "content": (
            "Normalization (1NF, 2NF, 3NF, BCNF) eliminates update, insertion, and deletion anomalies by removing transitive dependencies. "
            "B+ Trees keep keys sorted in balanced leaf pages, enabling O(log n) equality and range scans. "
            "Indexes speed up SELECTs at the cost of write amplification on INSERT/UPDATE/DELETE and extra storage."
        ),
    },
    # 3. Operating Systems
    {
        "id": "os_process_thread_sync",
        "topic": "Operating Systems",
        "subtopic": "Processes, Threads & Concurrency",
        "content": (
            "Processes have isolated virtual address spaces requiring IPC (pipes, sockets, shared memory), whereas threads share heap/code within one process and keep independent stacks and registers. "
            "Mutexes enforce mutual exclusion with single-owner semantics; semaphores maintain atomic counters for resource pools. "
            "Deadlocks require all four Coffman conditions: mutual exclusion, hold and wait, no preemption, and circular wait."
        ),
    },
    {
        "id": "os_virtual_memory_scheduling",
        "topic": "Operating Systems",
        "subtopic": "Virtual Memory, Paging & Scheduling",
        "content": (
            "Virtual memory maps virtual pages to physical frames using page tables accelerated by the TLB cache, isolating processes and allowing demand paging. "
            "Thrashing occurs when working sets exceed physical RAM and page faults dominate CPU utilization. "
            "CPU schedulers balance throughput, turnaround time, and response time across Round Robin, Shortest Job First, and multi-level feedback queues."
        ),
    },
    # 4. Computer Networks
    {
        "id": "cn_tcp_http_tls",
        "topic": "Computer Networks",
        "subtopic": "TCP, TLS, DNS & HTTP Evolution",
        "content": (
            "TCP establishes reliable ordered streams via SYN, SYN-ACK, ACK 3-way handshake, sliding window flow control, and congestion control (slow start, AIMD). "
            "HTTP/1.1 uses persistent keep-alive connections but suffers head-of-line blocking; HTTP/2 multiplexes frames over one TCP stream; HTTP/3 eliminates TCP HoL blocking over QUIC (UDP). "
            "TLS 1.3 completes key exchange via Diffie-Hellman (ECDHE) and verifies server identity via X.509 certificate chains."
        ),
    },
    {
        "id": "cn_dns_rest_websockets",
        "topic": "Computer Networks",
        "subtopic": "DNS Resolution, REST & WebSockets",
        "content": (
            "DNS translates domain names to IPs via recursive resolver, root nameserver, TLD nameserver, and authoritative nameserver with TTL caching. "
            "REST is stateless over HTTP verbs with cacheable responses, while WebSockets upgrade an HTTP connection to full-duplex persistent frames for low-latency bidirectional messaging."
        ),
    },
    # 5. OOP
    {
        "id": "oop_solid_principles",
        "topic": "OOP",
        "subtopic": "Four Pillars & SOLID Architecture",
        "content": (
            "Encapsulation bundles state with invariants; Abstraction hides implementation volatility; Inheritance models 'is-a' reuse; Polymorphism dispatches behavior cleanly through interfaces. "
            "Favor composition over deep inheritance hierarchies to avoid fragile base class coupling. "
            "SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion."
        ),
    },
    {
        "id": "oop_design_patterns",
        "topic": "OOP",
        "subtopic": "Creational & Behavioral Patterns",
        "content": (
            "Factory decouples object instantiation from callers; Strategy swaps algorithms dynamically via a shared interface (ideal for LLM/storage providers); "
            "Observer notifies subscribers cleanly without tight coupling; Decorator adds cross-cutting behaviors dynamically without subclass explosion."
        ),
    },
    # 6. Java
    {
        "id": "java_jvm_collections",
        "topic": "Java",
        "subtopic": "JVM Memory, GC & HashMap Internals",
        "content": (
            "JVM allocates objects in generational Heap (Eden, Survivor S0/S1, Old Gen) while call frames and local primitives live on thread Stacks; G1/ZGC compact live objects with low pause times. "
            "HashMap uses array buckets with hashCode & equals contracts; since Java 8, buckets exceeding 8 nodes treeify into Red-Black trees for O(log n) worst-case lookup. "
            "Always override both hashCode() and equals() consistently for value keys."
        ),
    },
    {
        "id": "java_concurrency_spring",
        "topic": "Java",
        "subtopic": "Concurrency, CompletableFuture & Spring Boot",
        "content": (
            "Java synchronized/ReentrantLock coordinate intrinsic monitors; volatile ensures happens-before visibility across CPU caches without atomicity; ConcurrentHashMap locks at bucket granularity. "
            "Spring IoC manages singleton/request bean lifecycles via Constructor Injection and proxies AOP cross-cutting concerns like @Transactional."
        ),
    },
    # 7. Python
    {
        "id": "python_gil_async",
        "topic": "Python",
        "subtopic": "GIL, Asyncio vs Multiprocessing & Data Model",
        "content": (
            "CPython's Global Interpreter Lock (GIL) allows one thread to execute Python bytecode per process at a time, making threading ideal for I/O-bound workloads while CPU-bound parallelism needs multiprocessing or C-extensions. "
            "Asyncio uses a single-threaded cooperative event loop with coroutines (`async`/`await`). "
            "Distinguish mutable (list, dict, set) vs immutable (int, str, tuple) types and avoid mutable default function arguments."
        ),
    },
    {
        "id": "python_generators_decorators_fastapi",
        "topic": "Python",
        "subtopic": "Decorators, Generators & FastAPI Pydantic",
        "content": (
            "Generators yield items lazily with constant O(1) memory overhead instead of materializing full lists. "
            "Decorators wrap callables using closures and functools.wraps to preserve metadata. "
            "FastAPI pairs Starlette ASGI async concurrency with Pydantic v2 Rust-backed schema validation and dependency injection."
        ),
    },
    # 8. SQL
    {
        "id": "sql_joins_windows",
        "topic": "SQL",
        "subtopic": "JOINs, Window Functions & CTEs",
        "content": (
            "INNER JOIN keeps matching rows; LEFT JOIN preserves all left rows with NULLs for unmatched right attributes. "
            "WHERE filters rows before aggregation; HAVING filters groups after GROUP BY. "
            "Window functions (ROW_NUMBER, RANK, DENSE_RANK, LAG/LEAD) compute analytics across partitions without collapsing rows."
        ),
    },
    {
        "id": "sql_optimization_explain",
        "topic": "SQL",
        "subtopic": "Query Optimization, Composite Indexes & N+1",
        "content": (
            "Use EXPLAIN ANALYZE to inspect Sequential Scans vs Index Scans and join strategies (Nested Loop, Hash Join, Merge Join). "
            "Composite indexes follow the leftmost prefix rule, so column ordering by equality then range predicates matters. "
            "Eliminate N+1 ORM queries using JOINs, IN batches, or Prisma include/select."
        ),
    },
    # 9. Full Stack & HR
    {
        "id": "fullstack_auth_caching_scaling",
        "topic": "Full Stack & HR",
        "subtopic": "Auth Rotation, Redis Caching & API Scalability",
        "content": (
            "Secure JWT auth uses short-lived Bearer access tokens with HttpOnly SameSite rotated refresh cookies storing hashed tokens in PostgreSQL to detect replay attacks. "
            "Redis read-through caching cuts database read load with TTL invalidation and rate limiting protects APIs via sliding window/token bucket algorithms. "
            "Idempotency keys prevent duplicate writes during client retries."
        ),
    },
    {
        "id": "hr_behavioral_star",
        "topic": "Full Stack & HR",
        "subtopic": "Behavioral Ownership, Debugging & STAR Framework",
        "content": (
            "Strong behavioral answers use STAR: concise Situation and Task (20%), concrete individual Actions and technical trade-offs (60%), and quantified Result plus retrospective reflection (20%). "
            "Demonstrate ownership over blame during production incidents, clear stakeholder communication, and willingness to evaluate constructive feedback."
        ),
    },
]
