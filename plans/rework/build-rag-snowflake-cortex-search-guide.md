# Build RAG in Snowflake with Cortex Search: A Step-by-Step Guide

> **Editor notes (delete before publishing)**
>
> **What changed:** Removed the "game-changer / comprehensive guide / no fluff" opening and the "Your RAG journey starts now" closing (including "every expert was once a beginner" and the rocket emoji). Regrouped about 30 flat H2s into 10 sections with H3 subsections. Added short prose before or after each long code block, describing only what the code shows. All code is unchanged; language tags added (sql, python, javascript). En-dashes removed. The two documentation URLs that were plain text are now links.
>
> **Cut:** "The code examples in this guide are production-ready. They work." Several blocks below are stubs or will not run as written (see next list), so that sentence would invite a reader complaint. Your claim about using variations of these patterns in systems handling millions of queries per month is kept.
>
> **Check before republishing (I could not verify these, and some look wrong):**
> - Query syntax: every example calls `SERVICE_NAME!SEARCH(question, n)` inside `TABLE()`. As far as I know the documented SQL route is `SNOWFLAKE.CORTEX.SEARCH_PREVIEW('<db.schema.service>', '<json>')`, which returns a JSON string, plus the Python and REST APIs. Please run one of these queries on a live account and confirm the syntax, because most of the post depends on it.
> - Filtering (`{'filter': {'@eq': {'category': 'Security'}}}`) needs the column declared with `ATTRIBUTES` when the service is created. Step 3 does not declare any attributes.
> - `INFORMATION_SCHEMA.CORTEX_SEARCH_SERVICES(...)` in Step 9: confirm this table function exists.
> - Several objects are created as SQL UDFs (`CREATE FUNCTION ... LANGUAGE SQL`) but use `BEGIN ... EXCEPTION`, `DECLARE`, or `INSERT` (ASK_SAFE, ASK_WITH_METRICS, ASK_SECURE). Snowflake SQL UDFs are single expressions; these probably need to be stored procedures.
> - `CASE` inside `TABLE()` to pick a search service (ASK_MULTILANG, ASK_LARGE_SCALE) is unlikely to work. ASK_MULTILANG also references `PRODUCT_DOCS_SEARCH_FR`, which the post never creates.
> - The materialized view in "Slow response times" uses a join. Snowflake materialized views do not support joins, as far as I know.
> - `SYSTEM$SEND_EMAIL` normally takes a notification integration name as its first argument.
> - The row access policy compares `user_department` (applied to CATEGORY) with `CURRENT_USER()`, which looks like a logic slip.
> - Model names and availability (mistral-7b, mistral-large2, llama3.1-70b, llama3.1-405b) change often and vary by region. Also check whether you want to mention AI_COMPLETE alongside COMPLETE.
> - Cost: `CREDITS_USED * 3` assumes $3 per credit, which varies by edition and region. WAREHOUSE_METERING_HISTORY also excludes Cortex Search serving and COMPLETE token charges, so the "$0.002 to 0.005 per query" figure should say how it was calculated.
> - Your numbers to stand behind: 40% fewer support tickets, 10+ million documents, the latency and 99.7% success figures, "over a year" of building. The markers below suggest evidence for two of them.
> - The Python and Node examples hard-code a password, and the SQL API example builds the statement with an f-string. Consider switching to key-pair auth and bind variables.

When I first heard about building Retrieval-Augmented Generation (RAG) systems directly in Snowflake, I was skeptical that a data warehouse could handle AI workloads this cleanly. After many hours experimenting with Snowflake Cortex Search, I changed my mind.

This guide is for data engineers who already work in Snowflake and want a working RAG application without running a separate vector database. You will build a document table, a Cortex Search service, a SQL function that retrieves context and calls an LLM, and then the production pieces around it: filtering, caching, logging, security, testing and cost monitoring.

## Why Build RAG in Snowflake

### What RAG is

Retrieval-Augmented Generation combines a large language model with your own data. Instead of relying only on what the model learned during training, a RAG system retrieves relevant passages from your documents and passes them to the model as context, so the answer is grounded in your content and stays current.

Think of it as giving an assistant access to your company's knowledge base before it answers. The answers are [more accurate and more relevant](/snowflake-cortex-aisql-query-optimization-guide) because they come from your actual data.

### Why I chose Snowflake

These were my reasons for building RAG in Snowflake rather than on a separate stack:

1. **Your data is already there.** No need to move it between systems.
2. **Built-in security.** The documents stay under Snowflake's existing security controls.
3. **Simpler architecture.** There is no separate vector database to manage.
4. **Cost-effective.** You pay only for what you use.
5. **Scale.** It handles millions of documents.

I once spent weeks setting up a separate vector database, managing embeddings and dealing with synchronization issues between it and the source data. With Cortex Search, that layer goes away.

## Build the RAG Pipeline Step by Step

### Prerequisites

- A Snowflake account (a trial account works)
- ACCOUNTADMIN or a role with the privileges to create databases, warehouses and Cortex Search services
- Basic SQL
- Some sample documents (PDFs, text files or structured data)

### Step 1: Set up the environment

I always keep RAG projects in a dedicated database for better organization.

```sql
-- Create a database for our RAG project
CREATE DATABASE IF NOT EXISTS RAG_PROJECT;
-- Create a schema for our documents
CREATE SCHEMA IF NOT EXISTS RAG_PROJECT.DOCUMENT_STORE;
-- Set the context
USE DATABASE RAG_PROJECT;
USE SCHEMA DOCUMENT_STORE;
-- Create a warehouse for our workload
CREATE WAREHOUSE IF NOT EXISTS RAG_WAREHOUSE
WITH WAREHOUSE_SIZE = 'MEDIUM'
AUTO_SUSPEND = 60
AUTO_RESUME = TRUE;
USE WAREHOUSE RAG_WAREHOUSE;
```

Start with a MEDIUM warehouse. You can scale up later, but for most RAG workloads this size is the right starting point.

### Step 2: Prepare the document data

For this walkthrough I use a product documentation knowledge base, a scenario I have built for a client.

```sql
-- Create a table to store our documents
CREATE OR REPLACE TABLE PRODUCT_DOCUMENTATION (
    DOC_ID VARCHAR(100),
    TITLE VARCHAR(500),
    CONTENT TEXT,
    CATEGORY VARCHAR(100),
    LAST_UPDATED TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    METADATA VARIANT
);
-- Insert sample product documentation
INSERT INTO PRODUCT_DOCUMENTATION (DOC_ID, TITLE, CONTENT, CATEGORY, METADATA)
VALUES
(
    'DOC001',
    'Getting Started with CloudSync Pro',
    'CloudSync Pro is an enterprise file synchronization solution that enables seamless collaboration across teams. 
    To get started, first download the desktop client from our portal. Install the application and sign in using your 
    corporate credentials. The initial sync may take several hours depending on your data volume. We recommend starting 
    with smaller folders and gradually adding more. CloudSync Pro supports real-time synchronization, version control, 
    and automatic conflict resolution. For optimal performance, ensure your network connection is stable and your 
    firewall allows traffic on ports 443 and 8080.',
    'Getting Started',
    PARSE_JSON('{"version": "3.2", "author": "Technical Writing Team", "views": 15420}')
),
(
    'DOC002',
    'Troubleshooting Connection Issues',
    'If you are experiencing connection issues with CloudSync Pro, follow these steps: First, verify your internet 
    connectivity by accessing other websites. Check if your firewall or antivirus is blocking the application. 
    CloudSync Pro requires outbound HTTPS connections on port 443. Navigate to Settings > Network and click Test 
    Connection. If the test fails, review your proxy settings. For corporate networks, you may need to configure 
    proxy authentication. Common error codes: ERR_001 indicates firewall blocking, ERR_002 means invalid credentials, 
    ERR_003 suggests server maintenance. If issues persist, collect logs from Help > Generate Support Bundle and 
    contact our support team.',
    'Troubleshooting',
    PARSE_JSON('{"version": "3.2", "author": "Support Team", "views": 8932}')
),
(
    'DOC003',
    'Advanced Security Features',
    'CloudSync Pro offers enterprise-grade security features including end-to-end encryption, zero-knowledge architecture, 
    and compliance with SOC 2 Type II, GDPR, and HIPAA requirements. All data is encrypted using AES-256 encryption both 
    in transit and at rest. Administrators can enforce two-factor authentication, set password complexity requirements, 
    and configure session timeouts. The Data Loss Prevention (DLP) module scans files for sensitive information like 
    credit card numbers and social security numbers. Audit logs track all user activities including file access, sharing, 
    and deletions. For enhanced security, enable the Remote Wipe feature which allows administrators to delete company 
    data from lost or stolen devices.',
    'Security',
    PARSE_JSON('{"version": "3.2", "author": "Security Team", "views": 5643}')
),
(
    'DOC004',
    'Pricing and License Management',
    'CloudSync Pro offers flexible pricing plans: Starter plan at $10/user/month includes 100GB storage, Standard plan 
    at $25/user/month includes 1TB storage and priority support, Enterprise plan at $50/user/month includes unlimited 
    storage and dedicated account manager. Annual subscriptions receive 20% discount. License management is handled 
    through the Admin Portal. To add users, navigate to Users > Add User and enter their email address. Licenses are 
    automatically assigned upon invitation acceptance. You can upgrade or downgrade plans at any time with prorated 
    billing. Volume discounts available for organizations with 100+ users. Educational institutions receive 50% discount 
    with valid credentials.',
    'Pricing',
    PARSE_JSON('{"version": "3.2", "author": "Sales Team", "views": 12876}')
),
(
    'DOC005',
    'API Integration Guide',
    'CloudSync Pro provides a comprehensive REST API for custom integrations. Authentication uses OAuth 2.0 with API 
    keys available in the Developer section of your dashboard. Base URL: https://api.cloudsyncpro.com/v1. Key endpoints 
    include: /files for file operations, /users for user management, /shares for collaboration features. Rate limits 
    apply: 1000 requests per hour for Standard plans, 5000 for Enterprise. All requests must include the Authorization 
    header with your API key. Responses are in JSON format. Sample request to upload a file: POST /files with 
    multipart/form-data containing the file and metadata. Webhooks are available for real-time notifications of file 
    changes, sharing events, and user activities. SDK libraries available for Python, JavaScript, Java, and .NET.',
    'API Documentation',
    PARSE_JSON('{"version": "3.2", "author": "Engineering Team", "views": 4521}')
);
-- Verify our data
SELECT DOC_ID, TITLE, CATEGORY FROM PRODUCT_DOCUMENTATION;
```

The table holds one row per document with a free-text CONTENT column (the part that gets searched), a CATEGORY you can filter on later, and a VARIANT METADATA column for version, author and view counts. Replace the five INSERT rows with your own documents; the final SELECT just confirms they loaded.

### Step 3: Create a Cortex Search service

Cortex Search handles the embeddings, the vector index and the semantic search for you.

```sql
-- Create a Cortex Search Service
CREATE OR REPLACE CORTEX SEARCH SERVICE PRODUCT_DOCS_SEARCH
ON CONTENT
WAREHOUSE = RAG_WAREHOUSE
TARGET_LAG = '1 hour'
AS (
    SELECT 
        DOC_ID,
        CONTENT,
        TITLE,
        CATEGORY,
        LAST_UPDATED
    FROM PRODUCT_DOCUMENTATION
);
```

When this runs, Snowflake:

- generates embeddings for the CONTENT column,
- builds a search index,
- sets up incremental refresh according to TARGET_LAG, and
- makes the service queryable from SQL.

The first time I ran this, the setup that used to take me hours of embedding generation and vector database configuration finished in seconds.

[ADD YOUR OWN: a screenshot of SHOW CORTEX SEARCH SERVICES for PRODUCT_DOCS_SEARCH on your account, and how long the CREATE statement took to finish]

### Step 4: Test the search service

```sql
-- Check search service status
SHOW CORTEX SEARCH SERVICES;
-- Test a basic search query
SELECT 
    PARSE_JSON(results) as search_results
FROM TABLE(
    RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
        'How do I fix connection problems?',
        1
    )
);
```

This checks that the service exists and returns the single most relevant document for a question about connection problems.

### Step 5: Build the RAG query function

The RAG function does three things: search for relevant documents, combine their content into a context string, and pass that context to an LLM to generate the answer.

```sql
-- Create a function that performs RAG
CREATE OR REPLACE FUNCTION ASK_PRODUCT_DOCS(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:doc_id::VARCHAR as doc_id,
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                3  -- Get top 3 most relevant documents
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a helpful product documentation assistant. ',
                'Use the following documentation to answer the user question. ',
                'If the answer is not in the documentation, say you don\'t know. ',
                'Be concise and accurate.\n\n',
                'Documentation:\n',
                combined_context,
                '\n\nUser Question: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
```

This function is the core of the system:

1. **search_results CTE:** asks Cortex Search for the 3 most relevant documents.
2. **context CTE:** joins the retrieved documents into one context string with LISTAGG, separated by `---`.
3. **COMPLETE:** sends that context plus the question to the language model, with an instruction to say "I don't know" when the answer is not in the documentation.

I usually use `mistral-large2` for RAG because it is fast and cost-effective. For more complex reasoning you can switch to `llama3.1-405b` by changing the first argument to COMPLETE.

### Step 6: Query the RAG system

```sql
-- Example 1: Technical support question
SELECT ASK_PRODUCT_DOCS('How do I troubleshoot connection issues?') as answer;
-- Example 2: Pricing inquiry
SELECT ASK_PRODUCT_DOCS('What are the different pricing plans available?') as answer;
-- Example 3: Security question
SELECT ASK_PRODUCT_DOCS('What security certifications does CloudSync Pro have?') as answer;
-- Example 4: Integration question
SELECT ASK_PRODUCT_DOCS('How can I integrate CloudSync Pro with my application?') as answer;
```

Each answer is drawn from the documents loaded in Step 2 and formatted as a direct reply to the question.

[ADD YOUR OWN: paste the actual answer Snowflake returned for one of these four questions, unedited, so readers can see what the output looks like]

### Step 7: Filter by metadata and add conversation history

#### Filtering by metadata

Being able to filter search results is one of the features I like most in Cortex Search. This version only searches security documents:

```sql
-- Search only security-related documents
CREATE OR REPLACE FUNCTION ASK_SECURITY_DOCS(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                3,
                {'filter': {'@eq': {'category': 'Security'}}}
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a security documentation expert. ',
                'Use only the security documentation provided to answer questions. ',
                'Be precise about security features and compliance.\n\n',
                'Documentation:\n',
                combined_context,
                '\n\nQuestion: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
-- Test security-specific query
SELECT ASK_SECURITY_DOCS('What encryption does the product use?') as answer;
```

The only differences from ASK_PRODUCT_DOCS are the third argument to SEARCH, which restricts results to `category = 'Security'`, and a prompt written for a security audience.

#### Conversation history

To build a chatbot, pass the previous turns in as a second argument:

```sql
CREATE OR REPLACE FUNCTION ASK_WITH_HISTORY(
    question VARCHAR,
    conversation_history VARCHAR
)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                3
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a helpful product assistant. Use the documentation and conversation history to answer. ',
                'Be conversational and reference previous context when relevant.\n\n',
                'Previous Conversation:\n',
                conversation_history,
                '\n\nDocumentation:\n',
                combined_context,
                '\n\nCurrent Question: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
```

The retrieval step is the same. The prompt now includes a "Previous Conversation" block before the documentation, so the model can refer back to earlier questions. Your application is responsible for building and passing the `conversation_history` string.

### Step 8: Wrap it for applications

For applications I add a simpler entry point:

```sql
-- Create a view for easy querying
CREATE OR REPLACE VIEW PRODUCT_DOCS_QA AS
SELECT 
    'Use: SELECT * FROM PRODUCT_DOCS_QA WHERE question = ''your question here''' as usage_instructions
UNION ALL
SELECT 
    'Available categories: Getting Started, Troubleshooting, Security, Pricing, API Documentation'
;
-- Create a procedure for interactive queries
CREATE OR REPLACE PROCEDURE ASK_DOCS(QUESTION VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    BEGIN
        LET answer VARCHAR;
        answer := (SELECT ASK_PRODUCT_DOCS(:QUESTION));
        RETURN answer;
    END;
$$;
-- Test the procedure
CALL ASK_DOCS('What is the rate limit for API calls?');
```

The view only returns usage instructions as text. The useful part is the ASK_DOCS procedure, which wraps ASK_PRODUCT_DOCS so callers can use `CALL ASK_DOCS('...')`.

### Step 9: Monitor and maintain

I learned the hard way that you need to monitor a RAG system from the start.

```sql
-- Check search service performance
SELECT 
    SERVICE_NAME,
    DATABASE_NAME,
    SCHEMA_NAME,
    SEARCH_COLUMN,
    CREATED_ON,
    REFRESHED_ON
FROM TABLE(
    INFORMATION_SCHEMA.CORTEX_SEARCH_SERVICES(
        DATABASE_NAME => 'RAG_PROJECT',
        SCHEMA_NAME => 'DOCUMENT_STORE'
    )
);
-- Create a logging table for queries
CREATE OR REPLACE TABLE QUERY_LOG (
    QUERY_ID VARCHAR(100) DEFAULT UUID_STRING(),
    QUESTION TEXT,
    ANSWER TEXT,
    EXECUTION_TIME NUMBER(10,2),
    TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
-- Enhanced function with logging
CREATE OR REPLACE FUNCTION ASK_PRODUCT_DOCS_WITH_LOG(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                3
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    ),
    answer_result AS (
        SELECT 
            SNOWFLAKE.CORTEX.COMPLETE(
                'mistral-large2',
                CONCAT(
                    'You are a helpful product documentation assistant. ',
                    'Use the following documentation to answer the user question. ',
                    'If the answer is not in the documentation, say you don\'t know.\n\n',
                    'Documentation:\n',
                    combined_context,
                    '\n\nQuestion: ',
                    question,
                    '\n\nAnswer:'
                )
            ) as answer
        FROM context
    )
    SELECT answer FROM answer_result
$$;
```

The first query lists the search services in the schema with their creation and last refresh times. The QUERY_LOG table gives you somewhere to record questions, answers and execution time. Note that ASK_PRODUCT_DOCS_WITH_LOG, despite its name, does not write to QUERY_LOG: it returns the answer the same way as ASK_PRODUCT_DOCS, so you need to add the insert in your application or a procedure.

### Step 10: Update the knowledge base

New documents are picked up automatically. Insert them into the source table:

```sql
-- Add new documentation
INSERT INTO PRODUCT_DOCUMENTATION (DOC_ID, TITLE, CONTENT, CATEGORY, METADATA)
VALUES
(
    'DOC006',
    'Mobile App Configuration',
    'The CloudSync Pro mobile app is available for iOS and Android devices. Download from the App Store or Google Play. 
    After installation, tap Sign In and enter your credentials. Enable biometric authentication for quick access. 
    Configure sync settings under Settings > Sync Options. You can choose to sync over Wi-Fi only to save mobile data. 
    Enable camera upload to automatically backup photos and videos. The app supports offline access - files are cached 
    locally and sync when connection is restored. Battery optimization: disable background refresh if battery life is 
    a concern. Push notifications can be customized for file sharing, comments, and mentions.',
    'Mobile',
    PARSE_JSON('{"version": "3.2", "author": "Mobile Team", "views": 7234}')
);
-- The Cortex Search Service automatically updates based on TARGET_LAG
-- Wait for the target lag period (1 hour in our case), then test:
SELECT ASK_PRODUCT_DOCS('How do I configure the mobile app?') as answer;
```

The service refreshes according to TARGET_LAG, so with the 1 hour setting from Step 3 the new document becomes searchable within about an hour.

## Two Real-World Use Cases

### Customer support portal

I built a customer-facing chatbot on this pattern that reduced support tickets by 40%. The key was making the assistant aware of the customer's plan so it gave relevant answers:

[ADD YOUR OWN: how you measured the 40% reduction, for example ticket counts per week before and after launch and over what period, without naming the client]

```sql
-- Category-aware support function
CREATE OR REPLACE FUNCTION SUPPORT_ASSISTANT(
    question VARCHAR,
    user_plan VARCHAR  -- 'Starter', 'Standard', 'Enterprise'
)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title,
            value:category::VARCHAR as category
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                5
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || ' (Category: ' || category || ')\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a customer support assistant. The user has a ',
                user_plan,
                ' plan. Use the documentation to help them. ',
                'If a feature is not available in their plan, mention upgrade options.\n\n',
                'Documentation:\n',
                combined_context,
                '\n\nCustomer Question: ',
                question,
                '\n\nResponse:'
            )
        ) as answer
    FROM context
$$;
-- Test with different user plans
SELECT SUPPORT_ASSISTANT('Can I use the API?', 'Starter') as starter_response;
SELECT SUPPORT_ASSISTANT('Can I use the API?', 'Enterprise') as enterprise_response;
```

This version retrieves 5 documents instead of 3, includes each document's category in the context, and passes the customer's plan into the prompt so the model can mention upgrade options when a feature is not included. The two test calls show the same question answered for a Starter and an Enterprise customer.

### Internal knowledge management

For a Fortune 500 client, I built an internal wiki search that their executives liked. The function returns a short structured summary rather than a direct answer:

```sql
-- Executive summary function
CREATE OR REPLACE FUNCTION EXECUTIVE_SUMMARY(topic VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                topic,
                5
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'Create a concise executive summary about: ',
                topic,
                '\n\nUse these documents as sources:\n',
                combined_context,
                '\n\nProvide:\n',
                '1. Key Points (3-5 bullets)\n',
                '2. Business Impact\n',
                '3. Recommended Actions\n\n',
                'Keep it under 200 words. Be strategic and actionable.'
            )
        ) as summary
    FROM context
$$;
SELECT EXECUTIVE_SUMMARY('product security and compliance') as exec_summary;
```

The retrieval is unchanged. The prompt asks for key points, business impact and recommended actions in under 200 words, which suits a topic-level question better than a single fact lookup.

## Performance and Cost

These are the lessons I took from building several RAG systems.

### Chunk large documents

If your documents are long, split them into smaller chunks before indexing:

```sql
-- Create a chunked version of documents
CREATE OR REPLACE TABLE PRODUCT_DOCUMENTATION_CHUNKED AS
WITH RECURSIVE chunks AS (
    SELECT 
        DOC_ID,
        TITLE,
        CATEGORY,
        CONTENT,
        1 as chunk_num,
        SUBSTR(CONTENT, 1, 1000) as chunk_content,
        LENGTH(CONTENT) as total_length
    FROM PRODUCT_DOCUMENTATION
    UNION ALL
    SELECT 
        DOC_ID,
        TITLE,
        CATEGORY,
        CONTENT,
        chunk_num + 1,
        SUBSTR(CONTENT, chunk_num * 1000 + 1, 1000),
        total_length
    FROM chunks
    WHERE chunk_num * 1000 < total_length
)
SELECT 
    DOC_ID || '_CHUNK_' || chunk_num as CHUNK_ID,
    DOC_ID,
    TITLE,
    CATEGORY,
    chunk_content as CONTENT,
    chunk_num
FROM chunks
WHERE LENGTH(chunk_content) > 0;
-- Create search service on chunked data
CREATE OR REPLACE CORTEX SEARCH SERVICE PRODUCT_DOCS_SEARCH_CHUNKED
ON CONTENT
WAREHOUSE = RAG_WAREHOUSE
TARGET_LAG = '1 hour'
AS (
    SELECT 
        CHUNK_ID,
        CONTENT,
        TITLE,
        CATEGORY,
        DOC_ID
    FROM PRODUCT_DOCUMENTATION_CHUNKED
);
```

The recursive CTE cuts each document into 1,000-character pieces and gives each one a CHUNK_ID like `DOC001_CHUNK_1`. The second statement builds a separate search service on the chunked table. Change the `1000` values to adjust chunk size. This splits on character count, not on sentences or headings, so a chunk can start mid-sentence.

### Choose the right model

- **mistral-7b:** fast and cheap, good for simple Q&A
- **mistral-large2:** balanced, and my default
- **llama3.1-70b:** better reasoning for complex questions
- **llama3.1-405b:** best quality, highest cost

### Cache frequent answers

```sql
-- Create a cache table
CREATE OR REPLACE TABLE ANSWER_CACHE (
    QUESTION_HASH VARCHAR(64),
    QUESTION TEXT,
    ANSWER TEXT,
    CACHE_DATE TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
    HIT_COUNT NUMBER DEFAULT 1
);
-- Function with caching
CREATE OR REPLACE FUNCTION ASK_WITH_CACHE(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH cache_check AS (
        SELECT ANSWER 
        FROM ANSWER_CACHE 
        WHERE QUESTION_HASH = SHA2(LOWER(TRIM(question)))
        AND CACHE_DATE > DATEADD(hour, -24, CURRENT_TIMESTAMP())
        LIMIT 1
    )
    SELECT 
        COALESCE(
            (SELECT ANSWER FROM cache_check),
            ASK_PRODUCT_DOCS(question)
        ) as final_answer
$$;
```

ASK_WITH_CACHE looks up a hash of the normalized question and returns a cached answer if one is less than 24 hours old; otherwise it calls ASK_PRODUCT_DOCS. As written, nothing writes new answers into ANSWER_CACHE, so you need a separate step (for example a procedure or your application) that inserts the question hash and answer after each miss.

### Keep costs reasonable

1. **Right-size the warehouse.** Start small and scale when you need to.
2. **Use AUTO_SUSPEND.** Do not pay for idle compute.
3. **Cache frequent questions.** Avoid repeat LLM calls.
4. **Match the model to the task.** Do not use an expensive model for simple questions.
5. **Set TARGET_LAG sensibly.** Hourly refresh is usually enough.

```sql
-- Monitor your costs
SELECT 
    WAREHOUSE_NAME,
    SUM(CREDITS_USED) as total_credits,
    SUM(CREDITS_USED) * 3 as estimated_cost_usd  -- Approximate cost
FROM SNOWFLAKE.ACCOUNT_USAGE.WAREHOUSE_METERING_HISTORY
WHERE START_TIME >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY WAREHOUSE_NAME
ORDER BY total_credits DESC;
```

This totals warehouse credits per warehouse for the last 30 days. The `* 3` is a rough dollars-per-credit figure; replace it with your contract rate.

## Common Pitfalls and Troubleshooting

### Pitfalls to avoid

**Poor document structure.** Loading entire manuals as single documents. Break them into logical sections with clear titles.

**Generic prompts.** Not telling the model what role it plays. Always include system instructions and domain context.

**Ignoring metadata.** Treating every document as equal. Use version numbers, dates and categories to prefer recent, relevant content.

**No error handling.** Wrap the RAG call so users get a readable message instead of an error:

```sql
-- Add error handling
CREATE OR REPLACE FUNCTION ASK_SAFE(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    BEGIN
        RETURN ASK_PRODUCT_DOCS(question);
    EXCEPTION
        WHEN OTHER THEN
            RETURN 'I apologize, but I encountered an error processing your question. Please try rephrasing it or contact support.';
    END;
$$;
```

### Handling questions with no matching documents

Real users will ask questions your documentation cannot answer. This version checks for that before calling the LLM:

```sql
-- Function that handles empty results
CREATE OR REPLACE FUNCTION ASK_ROBUST(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                3
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context,
            COUNT(*) as doc_count
        FROM search_results
    )
    SELECT 
        CASE 
            WHEN doc_count = 0 THEN 
                'I apologize, but I could not find any relevant documentation for your question. ' ||
                'Please try rephrasing your question or contact our support team at support@cloudsyncpro.com.'
            ELSE
                SNOWFLAKE.CORTEX.COMPLETE(
                    'mistral-large2',
                    CONCAT(
                        'You are a helpful product documentation assistant. ',
                        'Use the following documentation to answer the user question. ',
                        'If you are not confident in your answer, say so clearly. ',
                        'Never make up information.\n\n',
                        'Documentation:\n',
                        combined_context,
                        '\n\nUser Question: ',
                        question,
                        '\n\nAnswer:'
                    )
                )
        END as answer
    FROM context
$$;
-- Test with question that has no answer
SELECT ASK_ROBUST('What is the recipe for chocolate cake?') as answer;
```

The context CTE also counts the retrieved documents. If the count is zero, the function returns a fixed message instead of calling COMPLETE, and the prompt tells the model never to make up information. The chocolate cake question at the end is a quick way to test the fallback.

### Search returns irrelevant results

Improve the metadata and filter on it:

```sql
-- Add better metadata
ALTER TABLE PRODUCT_DOCUMENTATION ADD COLUMN TAGS ARRAY;
UPDATE PRODUCT_DOCUMENTATION
SET TAGS = ARRAY_CONSTRUCT('installation', 'setup', 'beginner', 'windows', 'mac')
WHERE DOC_ID = 'DOC001';
-- Use tags in search
CREATE OR REPLACE FUNCTION ASK_WITH_TAGS(question VARCHAR, required_tags ARRAY)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    -- Implementation with tag filtering
    SELECT 'Enhanced search with tag filtering' as result
$$;
```

The first two statements add a TAGS array and populate it for one document. The ASK_WITH_TAGS function is only a placeholder that returns a fixed string; you need to add your own filtering logic.

### Slow response times

Use a bigger warehouse at peak times and cache popular content:

```sql
-- Create materialized view for frequently accessed docs
CREATE OR REPLACE MATERIALIZED VIEW POPULAR_DOCS AS
SELECT 
    d.*,
    COUNT(q.QUERY_ID) as access_count
FROM PRODUCT_DOCUMENTATION d
LEFT JOIN QUERY_LOG q ON q.ANSWER LIKE '%' || d.TITLE || '%'
WHERE q.TIMESTAMP > DATEADD(day, -7, CURRENT_TIMESTAMP())
GROUP BY d.DOC_ID, d.TITLE, d.CONTENT, d.CATEGORY, d.LAST_UPDATED, d.METADATA
HAVING access_count > 10;
-- Use larger warehouse for peak times
ALTER WAREHOUSE RAG_WAREHOUSE SET WAREHOUSE_SIZE = 'LARGE';
```

The view counts how often each document title appeared in answers over the last 7 days and keeps documents seen more than 10 times. The last statement resizes the warehouse to LARGE for peak periods.

### Context window exceeded

Truncate long documents before they reach the prompt:

```sql
-- Function with context management
CREATE OR REPLACE FUNCTION ASK_WITH_CONTEXT_LIMIT(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title,
            LENGTH(value:content::VARCHAR) as content_length
        FROM TABLE(
            RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(
                question,
                5
            )
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    truncated_context AS (
        SELECT 
            title,
            CASE 
                WHEN content_length > 1500 THEN 
                    SUBSTR(content, 1, 1500) || '... [truncated]'
                ELSE content
            END as content
        FROM search_results
        ORDER BY content_length DESC
        LIMIT 3  -- Only top 3 most relevant docs
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM truncated_context
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a helpful assistant. Answer concisely based on these excerpts:\n\n',
                combined_context,
                '\n\nQuestion: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
```

This retrieves 5 documents, cuts any document longer than 1,500 characters, and keeps 3 of them. Note that it orders by content length, not by search relevance, so check that this matches what you want.

## Deploying to Production

This is my checklist before a RAG system goes live.

### Roles and access

```sql
-- Create a service role
CREATE ROLE IF NOT EXISTS RAG_SERVICE_ROLE;
-- Grant necessary permissions
GRANT USAGE ON DATABASE RAG_PROJECT TO ROLE RAG_SERVICE_ROLE;
GRANT USAGE ON SCHEMA RAG_PROJECT.DOCUMENT_STORE TO ROLE RAG_SERVICE_ROLE;
GRANT SELECT ON ALL TABLES IN SCHEMA RAG_PROJECT.DOCUMENT_STORE TO ROLE RAG_SERVICE_ROLE;
GRANT USAGE ON WAREHOUSE RAG_WAREHOUSE TO ROLE RAG_SERVICE_ROLE;
-- Grant access to Cortex Search
GRANT USAGE ON CORTEX SEARCH SERVICE PRODUCT_DOCS_SEARCH TO ROLE RAG_SERVICE_ROLE;
```

### API access

```sql
-- Create a view for REST API access
CREATE OR REPLACE SECURE VIEW RAG_API AS
SELECT 
    CURRENT_TIMESTAMP() as query_time,
    'POST /api/ask' as endpoint,
    'Send JSON: {"question": "your question"}' as usage;
```

This view only documents the intended endpoint and payload. The actual HTTP calls are in the integration examples below.

### Monitoring dashboard

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW RAG_MONITORING AS
SELECT 
    DATE_TRUNC('hour', TIMESTAMP) as hour,
    COUNT(*) as query_count,
    AVG(EXECUTION_TIME) as avg_response_time
FROM QUERY_LOG
GROUP BY 1
ORDER BY 1 DESC;
```

This summarises QUERY_LOG by hour: query count and average response time.

### Security

Security matters most once a RAG system is exposed to users. This is what I always put in place:

```sql
-- Create row-level security policy
CREATE OR REPLACE ROW ACCESS POLICY DOCUMENT_ACCESS_POLICY
AS (user_department VARCHAR) 
RETURNS BOOLEAN ->
    CASE 
        WHEN CURRENT_ROLE() IN ('ACCOUNTADMIN', 'SYSADMIN') THEN TRUE
        WHEN user_department = CURRENT_USER() THEN TRUE
        ELSE FALSE
    END;
-- Apply policy to sensitive documents
ALTER TABLE PRODUCT_DOCUMENTATION 
ADD ROW ACCESS POLICY DOCUMENT_ACCESS_POLICY ON (CATEGORY);
-- Create audit logging
CREATE OR REPLACE TABLE RAG_AUDIT_LOG (
    AUDIT_ID VARCHAR(100) DEFAULT UUID_STRING(),
    USER_NAME VARCHAR(100),
    USER_ROLE VARCHAR(100),
    QUERY_TEXT TEXT,
    DOCUMENTS_ACCESSED ARRAY,
    ACCESS_GRANTED BOOLEAN,
    IP_ADDRESS VARCHAR(50),
    TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
-- Function with audit logging
CREATE OR REPLACE FUNCTION ASK_SECURE(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    BEGIN
        -- Log access attempt
        INSERT INTO RAG_AUDIT_LOG (
            USER_NAME,
            USER_ROLE,
            QUERY_TEXT,
            ACCESS_GRANTED
        )
        VALUES (
            CURRENT_USER(),
            CURRENT_ROLE(),
            question,
            TRUE
        );
        -- Return answer
        RETURN ASK_PRODUCT_DOCS(question);
    END;
$$;
-- Monitor for suspicious activity
SELECT 
    USER_NAME,
    COUNT(*) as query_count,
    COUNT(DISTINCT DATE_TRUNC('hour', TIMESTAMP)) as active_hours
FROM RAG_AUDIT_LOG
WHERE TIMESTAMP > DATEADD(day, -1, CURRENT_TIMESTAMP())
GROUP BY USER_NAME
HAVING query_count > 100  -- Flag high-volume users
ORDER BY query_count DESC;
```

The block does four things: creates a row access policy and attaches it to the documentation table, creates an audit log table, wraps the RAG call in ASK_SECURE so every question is logged with the user and role, and finally flags any user who asked more than 100 questions in the last day. Adjust the policy logic and the 100-query threshold for your own access model.

### Testing

I always build a test suite before release:

```sql
-- Create test cases table
CREATE OR REPLACE TABLE RAG_TEST_CASES (
    TEST_ID VARCHAR(100) DEFAULT UUID_STRING(),
    TEST_NAME VARCHAR(200),
    QUESTION TEXT,
    EXPECTED_KEYWORDS ARRAY,
    CATEGORY VARCHAR(100),
    PRIORITY VARCHAR(20)
);
-- Insert test cases
INSERT INTO RAG_TEST_CASES (TEST_NAME, QUESTION, EXPECTED_KEYWORDS, CATEGORY, PRIORITY)
VALUES
('Basic Connection Test', 
 'How do I fix connection issues?', 
 ARRAY_CONSTRUCT('firewall', 'port 443', 'test connection'),
 'Troubleshooting',
 'HIGH'),
('Pricing Query', 
 'What does the enterprise plan cost?', 
 ARRAY_CONSTRUCT('$50', 'unlimited storage', 'enterprise'),
 'Pricing',
 'HIGH'),
('Security Compliance', 
 'What security certifications do you have?', 
 ARRAY_CONSTRUCT('SOC 2', 'GDPR', 'HIPAA', 'encryption'),
 'Security',
 'HIGH'),
('API Rate Limits', 
 'What are the API rate limits?', 
 ARRAY_CONSTRUCT('1000', '5000', 'rate limit', 'enterprise'),
 'API Documentation',
 'MEDIUM');
-- Run test suite
CREATE OR REPLACE PROCEDURE RUN_RAG_TESTS()
RETURNS TABLE (test_name VARCHAR, passed BOOLEAN, answer TEXT, missing_keywords ARRAY)
LANGUAGE SQL
AS
$$
    DECLARE
        result_table RESULTSET;
    BEGIN
        result_table := (
            WITH test_results AS (
                SELECT 
                    t.TEST_NAME,
                    t.QUESTION,
                    t.EXPECTED_KEYWORDS,
                    ASK_PRODUCT_DOCS(t.QUESTION) as ANSWER
                FROM RAG_TEST_CASES t
                WHERE t.PRIORITY = 'HIGH'
            ),
            validation AS (
                SELECT 
                    TEST_NAME,
                    ANSWER,
                    EXPECTED_KEYWORDS,
                    ARRAY_AGG(keyword) as MISSING_KEYWORDS
                FROM test_results,
                LATERAL FLATTEN(input => EXPECTED_KEYWORDS) kw
                WHERE LOWER(ANSWER) NOT LIKE '%' || LOWER(kw.value::VARCHAR) || '%'
                GROUP BY TEST_NAME, ANSWER, EXPECTED_KEYWORDS
            )
            SELECT 
                t.TEST_NAME,
                CASE 
                    WHEN v.MISSING_KEYWORDS IS NULL THEN TRUE 
                    WHEN ARRAY_SIZE(v.MISSING_KEYWORDS) = 0 THEN TRUE
                    ELSE FALSE 
                END as PASSED,
                t.ANSWER,
                COALESCE(v.MISSING_KEYWORDS, ARRAY_CONSTRUCT()) as MISSING_KEYWORDS
            FROM test_results t
            LEFT JOIN validation v ON t.TEST_NAME = v.TEST_NAME
        );
        RETURN TABLE(result_table);
    END;
$$;
-- Execute tests
CALL RUN_RAG_TESTS();
```

Each test case lists keywords the answer must contain. RUN_RAG_TESTS runs the HIGH priority questions through ASK_PRODUCT_DOCS, finds any expected keywords missing from the answer, and returns a pass/fail row per test.

## Calling the RAG Function from Applications

### Python

```python
import snowflake.connector
def ask_snowflake_rag(question: str) -> str:
    conn = snowflake.connector.connect(
        user='your_user',
        password='your_password',
        account='your_account',
        warehouse='RAG_WAREHOUSE',
        database='RAG_PROJECT',
        schema='DOCUMENT_STORE'
    )
    cursor = conn.cursor()
    cursor.execute(
        "SELECT ASK_PRODUCT_DOCS(%s)",
        (question,)
    )
    result = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return result
# Usage
answer = ask_snowflake_rag("How do I reset my password?")
print(answer)
```

This opens a connection, runs ASK_PRODUCT_DOCS with the question as a bind parameter, and closes the connection. Replace the placeholder credentials with your own, ideally from environment variables or a secrets manager.

### Snowflake SQL API

If you use Snowflake's SQL API:

```python
import requests
import json
def query_rag_api(question: str, access_token: str) -> str:
    url = "https://<account>.snowflakecomputing.com/api/v2/statements"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Snowflake-Authorization-Token-Type": "KEYPAIR_JWT"
    }
    data = {
        "statement": f"SELECT ASK_PRODUCT_DOCS('{question}')",
        "timeout": 60,
        "database": "RAG_PROJECT",
        "schema": "DOCUMENT_STORE",
        "warehouse": "RAG_WAREHOUSE"
    }
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    return result['data'][0][0]
# Usage
answer = query_rag_api("What are the system requirements?", your_token)
print(answer)
```

The request posts a SQL statement to the `/api/v2/statements` endpoint with a key-pair JWT. Because the question is inserted directly into the SQL string, a question containing a single quote will break the statement; escape it or use the API's bind support.

### JavaScript / Node.js

```javascript
const snowflake = require('snowflake-sdk');
async function askSnowflakeRAG(question) {
    const connection = snowflake.createConnection({
        account: 'your_account',
        username: 'your_username',
        password: 'your_password',
        warehouse: 'RAG_WAREHOUSE',
        database: 'RAG_PROJECT',
        schema: 'DOCUMENT_STORE'
    });
    return new Promise((resolve, reject) => {
        connection.connect((err, conn) => {
            if (err) {
                reject(err);
                return;
            }
            conn.execute({
                sqlText: 'SELECT ASK_PRODUCT_DOCS(?)',
                binds: [question],
                complete: (err, stmt, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows[0]['ASK_PRODUCT_DOCS(?)']);
                    }
                    connection.destroy();
                }
            });
        });
    });
}
// Usage
askSnowflakeRAG('How do I enable two-factor authentication?')
    .then(answer => console.log(answer))
    .catch(err => console.error(err));
```

The Node version wraps the callback-based snowflake-sdk in a Promise, binds the question as a parameter, and closes the connection after the query completes.

## Advanced Patterns

### Multi-language support

One of my favorite projects was a multilingual RAG system. This is the approach:

```sql
-- Create multilingual documentation table
CREATE OR REPLACE TABLE PRODUCT_DOCUMENTATION_MULTILANG (
    DOC_ID VARCHAR(100),
    LANGUAGE VARCHAR(10),
    TITLE VARCHAR(500),
    CONTENT TEXT,
    CATEGORY VARCHAR(100),
    ORIGINAL_DOC_ID VARCHAR(100)
);
-- Insert translated versions
INSERT INTO PRODUCT_DOCUMENTATION_MULTILANG 
VALUES
(
    'DOC001_ES',
    'es',
    'Comenzando con CloudSync Pro',
    'CloudSync Pro es una solución empresarial de sincronización de archivos que permite la colaboración 
    fluida entre equipos. Para comenzar, primero descargue el cliente de escritorio desde nuestro portal. 
    Instale la aplicación e inicie sesión con sus credenciales corporativas...',
    'Getting Started',
    'DOC001'
),
(
    'DOC001_FR',
    'fr',
    'Premiers pas avec CloudSync Pro',
    'CloudSync Pro est une solution de synchronisation de fichiers d''entreprise qui permet une 
    collaboration transparente entre les équipes. Pour commencer, téléchargez d''abord le client 
    de bureau depuis notre portail...',
    'Getting Started',
    'DOC001'
);
-- Create language-specific search services
CREATE OR REPLACE CORTEX SEARCH SERVICE PRODUCT_DOCS_SEARCH_ES
ON CONTENT
WAREHOUSE = RAG_WAREHOUSE
TARGET_LAG = '1 hour'
AS (
    SELECT 
        DOC_ID,
        CONTENT,
        TITLE,
        CATEGORY
    FROM PRODUCT_DOCUMENTATION_MULTILANG
    WHERE LANGUAGE = 'es'
);
-- Create multilingual RAG function
CREATE OR REPLACE FUNCTION ASK_MULTILANG(question VARCHAR, lang VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            CASE 
                WHEN lang = 'es' THEN RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH_ES!SEARCH(question, 3)
                WHEN lang = 'fr' THEN RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH_FR!SEARCH(question, 3)
                ELSE RAG_PROJECT.DOCUMENT_STORE.PRODUCT_DOCS_SEARCH!SEARCH(question, 3)
            END
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG('Document: ' || title || '\nContent: ' || content, '\n\n---\n\n') as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                CASE 
                    WHEN lang = 'es' THEN 'Eres un asistente útil. Responde en español.'
                    WHEN lang = 'fr' THEN 'Vous êtes un assistant utile. Répondez en français.'
                    ELSE 'You are a helpful assistant. Answer in English.'
                END,
                '\n\nDocumentation:\n',
                combined_context,
                '\n\nQuestion: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
-- Test multilingual queries
SELECT ASK_MULTILANG('¿Cómo soluciono problemas de conexión?', 'es') as spanish_answer;
SELECT ASK_MULTILANG('Comment résoudre les problèmes de connexion?', 'fr') as french_answer;
```

Translated documents go into one table with a LANGUAGE column, each language gets its own search service, and ASK_MULTILANG picks the service and the answer language from the `lang` argument. The example only creates the Spanish service; create `PRODUCT_DOCS_SEARCH_FR` the same way before running the French query.

### Tracking performance

```sql
-- Create performance tracking table
CREATE OR REPLACE TABLE RAG_PERFORMANCE_METRICS (
    METRIC_ID VARCHAR(100) DEFAULT UUID_STRING(),
    QUERY_TEXT TEXT,
    SEARCH_TIME_MS NUMBER(10,2),
    LLM_TIME_MS NUMBER(10,2),
    TOTAL_TIME_MS NUMBER(10,2),
    DOCS_RETRIEVED NUMBER,
    MODEL_USED VARCHAR(50),
    SUCCESS BOOLEAN,
    ERROR_MESSAGE TEXT,
    TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
-- Enhanced function with performance tracking
CREATE OR REPLACE FUNCTION ASK_WITH_METRICS(question VARCHAR)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    DECLARE
        start_time TIMESTAMP_NTZ;
        search_start TIMESTAMP_NTZ;
        search_end TIMESTAMP_NTZ;
        llm_start TIMESTAMP_NTZ;
        llm_end TIMESTAMP_NTZ;
        result VARCHAR;
    BEGIN
        start_time := CURRENT_TIMESTAMP();
        search_start := CURRENT_TIMESTAMP();
        -- Perform search and generate answer
        result := ASK_PRODUCT_DOCS(question);
        -- Log metrics (simplified version)
        INSERT INTO RAG_PERFORMANCE_METRICS (
            QUERY_TEXT,
            TOTAL_TIME_MS,
            MODEL_USED,
            SUCCESS
        )
        VALUES (
            question,
            DATEDIFF(millisecond, start_time, CURRENT_TIMESTAMP()),
            'mistral-large2',
            TRUE
        );
        RETURN result;
    END;
$$;
-- Analyze performance
SELECT 
    DATE_TRUNC('day', TIMESTAMP) as day,
    AVG(TOTAL_TIME_MS) as avg_response_time_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY TOTAL_TIME_MS) as median_time_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY TOTAL_TIME_MS) as p95_time_ms,
    COUNT(*) as total_queries,
    SUM(CASE WHEN SUCCESS THEN 1 ELSE 0 END) as successful_queries
FROM RAG_PERFORMANCE_METRICS
GROUP BY 1
ORDER BY 1 DESC;
```

ASK_WITH_METRICS calls ASK_PRODUCT_DOCS and records the total time in RAG_PERFORMANCE_METRICS. The search and LLM timing columns are declared but not filled in this simplified version. The final query reports daily average, median and 95th percentile response times.

These were my numbers from production systems:

- Average response time: 1.2 to 2.5 seconds
- 95th percentile: under 4 seconds
- Success rate: 99.7%
- Cost per query: $0.002 to $0.005

[ADD YOUR OWN: the output of the daily performance query above, or a breakdown of where the per-query cost comes from (Cortex Search serving, COMPLETE tokens, warehouse time)]

### Scaling to millions of documents

For a client with more than 10 million documents, this is what worked:

```sql
-- Partition large document sets
CREATE OR REPLACE TABLE PRODUCT_DOCUMENTATION_LARGE (
    DOC_ID VARCHAR(100),
    TITLE VARCHAR(500),
    CONTENT TEXT,
    CATEGORY VARCHAR(100),
    YEAR NUMBER,
    QUARTER NUMBER,
    LAST_UPDATED TIMESTAMP_NTZ
)
CLUSTER BY (CATEGORY, YEAR, QUARTER);
-- Create separate search services for different partitions
CREATE OR REPLACE CORTEX SEARCH SERVICE DOCS_SEARCH_CURRENT_YEAR
ON CONTENT
WAREHOUSE = RAG_WAREHOUSE
TARGET_LAG = '30 minutes'
AS (
    SELECT 
        DOC_ID,
        CONTENT,
        TITLE,
        CATEGORY
    FROM PRODUCT_DOCUMENTATION_LARGE
    WHERE YEAR = YEAR(CURRENT_DATE())
);
CREATE OR REPLACE CORTEX SEARCH SERVICE DOCS_SEARCH_ARCHIVE
ON CONTENT
WAREHOUSE = RAG_WAREHOUSE
TARGET_LAG = '24 hours'
AS (
    SELECT 
        DOC_ID,
        CONTENT,
        TITLE,
        CATEGORY
    FROM PRODUCT_DOCUMENTATION_LARGE
    WHERE YEAR < YEAR(CURRENT_DATE())
);
-- Smart routing function
CREATE OR REPLACE FUNCTION ASK_LARGE_SCALE(question VARCHAR, prefer_recent BOOLEAN)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
    WITH search_results AS (
        SELECT 
            value:content::VARCHAR as content,
            value:title::VARCHAR as title
        FROM TABLE(
            CASE 
                WHEN prefer_recent THEN 
                    RAG_PROJECT.DOCUMENT_STORE.DOCS_SEARCH_CURRENT_YEAR!SEARCH(question, 3)
                ELSE 
                    RAG_PROJECT.DOCUMENT_STORE.DOCS_SEARCH_ARCHIVE!SEARCH(question, 3)
            END
        ),
        LATERAL FLATTEN(input => PARSE_JSON(results))
    ),
    context AS (
        SELECT 
            LISTAGG(
                'Document: ' || title || '\n' || 
                'Content: ' || content, 
                '\n\n---\n\n'
            ) as combined_context
        FROM search_results
    )
    SELECT 
        SNOWFLAKE.CORTEX.COMPLETE(
            'mistral-large2',
            CONCAT(
                'You are a helpful assistant. Use the documentation to answer:\n\n',
                combined_context,
                '\n\nQuestion: ',
                question,
                '\n\nAnswer:'
            )
        ) as answer
    FROM context
$$;
```

The table is clustered by category, year and quarter. Two search services split the data: current-year documents refresh every 30 minutes, archived documents every 24 hours, which cuts refresh work on data that rarely changes. ASK_LARGE_SCALE routes the question to one service or the other based on `prefer_recent`.

### Versioning prompts

To keep the system maintainable as models change:

```sql
-- Create version control for prompts
CREATE OR REPLACE TABLE PROMPT_VERSIONS (
    VERSION_ID VARCHAR(100) DEFAULT UUID_STRING(),
    PROMPT_NAME VARCHAR(200),
    PROMPT_TEXT TEXT,
    MODEL_NAME VARCHAR(50),
    PERFORMANCE_SCORE NUMBER(5,2),
    IS_ACTIVE BOOLEAN DEFAULT FALSE,
    CREATED_BY VARCHAR(100),
    CREATED_AT TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
-- AB test different prompts
CREATE OR REPLACE PROCEDURE AB_TEST_PROMPTS(question VARCHAR, version_a VARCHAR, version_b VARCHAR)
RETURNS TABLE (version VARCHAR, answer TEXT, user_rating NUMBER)
LANGUAGE SQL
AS
$$
    -- Implementation for A/B testing
$$;
```

PROMPT_VERSIONS stores each prompt with its model and a performance score so you can track which version is active. AB_TEST_PROMPTS is an empty placeholder for your own comparison logic.

## What I Recommend After a Year of Building RAG in Snowflake

### Start simple, then optimize

Do not over-engineer from day one. Build a basic RAG system first, measure it, then optimize based on real usage.

### Document quality beats quantity

I have seen better results from 100 well-written documents than from 1,000 mediocre ones. Time spent making the documentation clear pays off directly in answer quality.

### Collect user feedback

```sql
-- Create feedback table
CREATE OR REPLACE TABLE USER_FEEDBACK (
    FEEDBACK_ID VARCHAR(100) DEFAULT UUID_STRING(),
    QUERY_ID VARCHAR(100),
    QUESTION TEXT,
    ANSWER TEXT,
    RATING NUMBER(1,0),  -- 1-5 stars
    FEEDBACK_TEXT TEXT,
    USER_ID VARCHAR(100),
    TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
);
-- Analyze feedback to improve
SELECT 
    RATING,
    COUNT(*) as count,
    AVG(LENGTH(ANSWER)) as avg_answer_length,
    ARRAY_AGG(QUESTION) as sample_questions
FROM USER_FEEDBACK
GROUP BY RATING
ORDER BY RATING;
```

The query groups feedback by star rating and shows average answer length and sample questions for each rating, which is a quick way to see what kinds of questions get low scores.

### Alert on slow queries

```sql
-- Create alert for slow queries
CREATE OR REPLACE ALERT SLOW_QUERIES_ALERT
WAREHOUSE = RAG_WAREHOUSE
SCHEDULE = '60 MINUTE'
IF (EXISTS (
    SELECT 1 
    FROM RAG_PERFORMANCE_METRICS
    WHERE TIMESTAMP > DATEADD(hour, -1, CURRENT_TIMESTAMP())
    AND TOTAL_TIME_MS > 5000
    HAVING COUNT(*) > 10
))
THEN CALL SYSTEM$SEND_EMAIL(
    'admin@company.com',
    'RAG System Alert: High Latency Detected',
    'Multiple slow queries detected in the last hour'
);
```

The alert runs hourly and sends an email if more than 10 queries in the last hour took over 5 seconds. Change the recipient address and thresholds to suit your system.

### Revisit your prompts

As models improve, revisit your prompts. What worked with an older model might not be the best choice for a newer one.

### Final thoughts

Building RAG in Snowflake has been one of the most rewarding projects of my career. Running production AI workloads in a data warehouse seemed impossible to me a year earlier, and now it is practical. Cortex Search removes the usual barriers: no separate vector database, no embedding pipeline, no synchronization problems. Just SQL and your data.

I've used variations of these patterns in systems handling millions of queries per month. If you are starting out:

1. **Start small** with a single table of documents.
2. **Test** using the test case approach above.
3. **Measure** performance, cost and user satisfaction.
4. **Iterate** quickly rather than waiting for perfection.
5. **Listen to users**; their feedback will tell you what to fix.

Further reading:

- [Snowflake Cortex Search documentation](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search)
- [Cortex LLM functions](https://docs.snowflake.com/en/user-guide/snowflake-cortex/llm-functions)
- The Snowflake community forums, to compare notes with other practitioners

## Quick Reference

```sql
-- Create Database & Schema
CREATE DATABASE RAG_PROJECT;
CREATE SCHEMA RAG_PROJECT.DOCUMENT_STORE;
-- Create Search Service
CREATE CORTEX SEARCH SERVICE service_name
ON column_name
WAREHOUSE = warehouse_name
TARGET_LAG = 'interval'
AS (SELECT columns FROM table);
-- Query Search Service
SELECT * FROM TABLE(service_name!SEARCH('query', limit));
-- RAG with LLM
SELECT SNOWFLAKE.CORTEX.COMPLETE(
    'model_name',
    'prompt_with_context'
);
-- Common Models
-- mistral-7b: Fast, economical
-- mistral-large2: Balanced (recommended)
-- llama3.1-70b: Better reasoning
-- llama3.1-405b: Highest quality
```

Defaults I start with:

- MEDIUM warehouse
- TARGET_LAG of 1 hour for most cases
- 3 to 5 retrieved documents per question
- Chunks under 1,500 characters
- Error handling on every entry point
- Caching for frequent questions
- Cost and performance monitoring from day one
- Tests built from real user questions
