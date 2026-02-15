# LinkVault Mermaid Diagrams

## 1. Complete Data Flow: Upload to Storage

```mermaid
graph TD
    A[User Browser] -->|Selects File/Text| B[UploadForm Component]
    B -->|Validate Input| C{Valid Input?}
    C -->|No| D[Show Error Message]
    D --> B
    C -->|Yes| E[Create FormData]
    E -->|Add JWT Token| F[POST /api/shares/upload]

    F --> G[Backend Receives]
    G --> H[Multer Parses Multipart]
    H --> I[optionalAuthMiddleware]
    I --> J[Extract userId from JWT]

    J --> K[Generate shareId]
    K --> L[Validate Constraints]
    L --> M{File or Text?}

    M -->|File| N[Upload to Supabase Storage]
    N --> O[Path: shareId/fileName]
    O --> P[Generate Signed URL]
    P --> Q[Store File Metadata<br/>fileName, fileSize, fileMimeType]

    M -->|Text| R[Store textContent<br/>in Variable]

    Q --> S[Hash Password<br/>bcryptjs 10 rounds]
    R --> S
    S --> T[Calculate expiresAt]
    T --> U[Create MongoDB Document]

    U --> V[Save to MongoDB]
    V --> W[Return 201 Response]

    W --> X{Response Received}
    X -->|Success| Y[Display SuccessModal]
    Y --> Z[Show shareUrl]
    Z --> AA[User Copies Link]

    X -->|Error| AB[Show Error Alert]
    AB --> B

    style A fill:#e1f5ff
    style Y fill:#c8e6c9
    style N fill:#fff3e0
    style V fill:#f3e5f5
```

---

## 2. Data Flow: View & Download Share

```mermaid
graph TD
    A[User Opens /share/:shareId] --> B[GET /api/shares/info/:shareId]
    B --> C[Query MongoDB for Share]
    C --> D{Share Exists?}

    D -->|No| E[Return 404]
    E --> F[Show Not Found Message]

    D -->|Yes| G{Share Expired?}
    G -->|Yes| H[Delete from Supabase Storage]
    H --> I[Delete from MongoDB]
    I --> E

    G -->|No| J[Return Share Metadata]
    J --> K[Frontend Renders UI]

    K --> L{Content Type?}
    L -->|Text| M[Show Preview]
    L -->|File| N[Show File Info]

    M --> O{Password Protected?}
    N --> O

    O -->|Yes| P[Show Password Prompt]
    O -->|No| Q[Show View Button]

    P --> R[User Enters Password]
    R --> S[POST /api/shares/view/:shareId]
    Q --> S

    S --> T[Find Share in MongoDB]
    T --> U{Check Validations}

    U --> V{Password Correct?}
    V -->|No| W[Return 403 Forbidden]
    W --> X[Show Invalid Password]
    X --> R

    V -->|Yes| Y{One-Time View?}
    Y -->|Yes & Already Viewed| Z[Return 403 Forbidden]
    Z --> AA[Show Already Viewed]

    Y -->|Yes & Not Viewed| AB[Proceed]
    Y -->|No| AB

    AB --> AC{Max Views Reached?}
    AC -->|Yes| W
    AC -->|No| AD[Increment viewCount]

    AD --> AE{Content Type?}
    AE -->|Text| AF[Return Text Content]
    AE -->|File| AG[Return fileUrl + Metadata]

    AF --> AH[Display Text in UI]
    AG --> AI[Trigger Browser Download]

    AH --> AJ{One-Time View?}
    AI --> AJ

    AJ -->|Yes| AK[Delete from Supabase Storage]
    AK --> AL[Delete from MongoDB]
    AL --> AM[Show Deleted Message]

    AJ -->|No| AN[Show View Count]

    style A fill:#e1f5ff
    style S fill:#fff9c4
    style AH fill:#c8e6c9
    style AI fill:#c8e6c9
    style AM fill:#ffccbc
```

---

## 3. Authentication & Token Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Frontend as React App
    participant Supabase as Supabase Auth
    participant Backend as Express Backend
    participant DB as MongoDB

    User->>Frontend: Sign Up / Login
    Frontend->>Supabase: Auth Request<br/>(email, password)
    Supabase->>Supabase: Verify Credentials
    Supabase->>Frontend: Return JWT Token<br/>+ User Object
    Frontend->>Frontend: Store JWT in localStorage<br/>sb-{projectId}-auth-token

    User->>Frontend: Upload File
    Frontend->>Frontend: Read token from localStorage
    Frontend->>Backend: POST /api/shares/upload<br/>+ Authorization: Bearer {JWT}

    Backend->>Backend: Extract token from header
    Backend->>Supabase: Verify token<br/>auth.getUser(token)
    Supabase->>Backend: Return user object + id
    Backend->>Backend: Set req.userId = user.id

    Backend->>Supabase: Upload file to Storage
    Supabase->>Backend: Return filePath
    Backend->>DB: Save Share document<br/>with userId
    DB->>Backend: Confirm Save
    Backend->>Frontend: Return 201 + shareId

    Frontend->>User: Show Success Modal

    User->>Frontend: Visit Dashboard
    Frontend->>Frontend: Check localStorage token exists
    Frontend->>Backend: GET /api/shares/user-shares<br/>+ Authorization: Bearer {JWT}
    Backend->>Supabase: Verify token
    Supabase->>Backend: Return user object
    Backend->>DB: Find shares where userId = user.id
    DB->>Backend: Return user's shares
    Backend->>Frontend: Return shares list
    Frontend->>User: Display dashboard
```

---

## 4. Cleanup Flow: Three Mechanisms

```mermaid
graph TD
    A[Content Expires] --> B{Cleanup Mechanism}

    B --> C["1. On-Access Cleanup<br/>Reactive"]
    B --> D["2. Scheduled Job<br/>Every 5 minutes"]
    B --> E["3. MongoDB TTL Index<br/>Every 60 seconds"]

    C --> C1[User Visits /share/:shareId]
    C1 --> C2{Check expiresAt < now?}
    C2 -->|Yes| C3[Delete from Supabase Storage]
    C3 --> C4[Delete from MongoDB]
    C4 --> C5[Return 404 to User]

    D --> D1[Job Runs Every 5 Min]
    D1 --> D2[Query: expiresAt < now]
    D2 --> D3[For Each Expired Share]
    D3 --> D4[Delete File from Storage]
    D4 --> D5[Delete Document from DB]
    D5 --> D6[Log Cleanup Count]

    E --> E1[MongoDB Daemon Runs]
    E1 --> E2[Scan expiresAt Index]
    E2 --> E3{Find Docs<br/>expiresAt < now?}
    E3 -->|Yes| E4[Auto-Delete Document]
    E4 --> E5[Note: File Already<br/>Deleted by Job 2]

    C5 --> F[Content Permanently<br/>Removed]
    D6 --> F
    E5 --> F

    style C fill:#fff3e0
    style D fill:#e3f2fd
    style E fill:#f3e5f5
    style F fill:#c8e6c9
```

---

## 5. Database Schema: Share Collection

```mermaid
erDiagram
    SHARE {
        string _id "MongoDB ObjectId"
        string shareId "Unique, indexed, 12-char"
        string userId "Nullable, indexed, Supabase UUID"
        string contentType "Enum: text or file"
        string textContent "Nullable, raw text"
        string fileName "Nullable, original filename"
        string fileUrl "Nullable, signed Supabase URL"
        string storagePath "Nullable, storage path"
        number fileSize "Nullable, bytes"
        string fileMimeType "Nullable, MIME type"
        string password "Nullable, bcrypt hash"
        boolean isPasswordProtected "Default: false"
        boolean isOneTimeView "Default: false"
        number viewCount "Default: 0"
        number maxViewCount "Nullable, default: null"
        date createdAt "Auto: now()"
        date expiresAt "Indexed, TTL index"
        boolean isExpired "Default: false"
    }

    SUPABASE_USER {
        string id "UUID"
        string email "Unique"
        string created_at "Timestamp"
    }

    SUPABASE_STORAGE {
        string path "files/shareId/fileName"
        binary data "Raw file bytes"
        string signedUrl "Time-limited URL"
    }

    SHARE ||--o| SUPABASE_USER : "userId references"
    SHARE ||--o| SUPABASE_STORAGE : "storagePath references"
```

---

## 6. System Architecture Flow

```mermaid
graph TB
    subgraph Frontend["Frontend Layer (React + Vite)"]
        HP["HomePage<br/>- Upload Form"]
        LP["LoginPage<br/>- Auth Form"]
        SP["SharePage<br/>- View/Download"]
        DP["DashboardPage<br/>- User Shares"]
        AC["AuthContext<br/>- Supabase Client<br/>- JWT Storage"]
    end

    subgraph Backend["Backend Layer (Express.js)"]
        Routes["Routes<br/>- /shares<br/>- /auth<br/>- /users"]
        MW["Middleware<br/>- Auth<br/>- Multer<br/>- Error"]
        Jobs["Background Jobs<br/>- Cleanup<br/>- Every 5 min"]
        Utils["Utils<br/>- Password Hash<br/>- ID Generation<br/>- Supabase Client"]
    end

    subgraph Storage["Storage & Auth"]
        MONGO["MongoDB Atlas<br/>Share Metadata<br/>Indexes: shareId, userId, expiresAt"]
        SUPA["Supabase Storage<br/>File Bytes<br/>Path: files/shareId/fileName"]
        AUTH["Supabase Auth<br/>User Management<br/>JWT Tokens"]
    end

    HP -->|POST upload| Routes
    LP -->|Auth| AUTH
    SP -->|POST view| Routes
    DP -->|GET user-shares| Routes

    AC -->|JWT Token| Routes
    Routes -->|Auth Middleware| AC
    Routes -->|File Upload| MW
    MW -->|Multer Parse| Utils
    Utils -->|Mongoose| MONGO
    Utils -->|Supabase SDK| SUPA
    Utils -->|Auth Verify| AUTH

    Jobs -->|Query| MONGO
    Jobs -->|Delete| SUPA
    Jobs -->|Delete| MONGO

    AUTH -->|User Profile| Frontend
    MONGO -->|Metadata| Backend
    SUPA -->|Signed URLs| Frontend

    style Frontend fill:#e1f5ff
    style Backend fill:#f3e5f5
    style Storage fill:#fff3e0
```

---

## 7. Upload Process: Detailed Sequence

```mermaid
sequenceDiagram
    participant User
    participant Browser as Browser<br/>FileReader
    participant Frontend as React<br/>UploadForm
    participant Axios as Axios<br/>HTTP Client
    participant Backend as Express<br/>Route Handler
    participant Multer as Multer<br/>Parser
    participant Utils as Utils<br/>Helpers
    participant Supabase as Supabase<br/>Storage
    participant MongoDB as MongoDB<br/>Database

    User->>Browser: Select File/Enter Text
    Browser->>Frontend: onFileSelect / onTextChange
    Frontend->>Frontend: Validate<br/>- Size < 50MB<br/>- Text XOR File

    User->>Frontend: Click Upload
    Frontend->>Frontend: Collect Options<br/>- Password<br/>- Expiry<br/>- One-time
    Frontend->>Frontend: Create FormData<br/>+ JWT Token

    Frontend->>Axios: POST /api/shares/upload
    Axios->>Backend: HTTP POST<br/>Authorization: Bearer JWT

    Backend->>Multer: Parse multipart/form-data
    Multer->>Browser: Stream file buffer
    Multer->>Backend: return file, text, fields

    Backend->>Utils: generateShareId()
    Utils->>Backend: return 12-char ID

    Backend->>Utils: hashPassword(password)
    Utils->>Backend: return bcrypt hash

    Backend->>Utils: calculateExpiryTime(minutes)
    Utils->>Backend: return expiresAt timestamp

    alt File Upload
        Backend->>Supabase: uploadFileToStorage(buffer, name, shareId)
        Supabase->>Supabase: Save to bucket 'files'
        Supabase->>Backend: return filePath, size

        Backend->>Supabase: getSignedUrl(filePath, 3600)
        Supabase->>Backend: return https://...?token=...
    end

    Backend->>MongoDB: new Share(shareData)
    MongoDB->>MongoDB: Validate schema
    MongoDB->>MongoDB: Create indexes
    MongoDB->>Backend: return _id, created

    Backend->>Axios: return 201 JSON
    Axios->>Frontend: response.data
    Frontend->>Frontend: Show SuccessModal
    Frontend->>User: Display shareUrl<br/>Show Copy Button
```

---

## 8. View/Access Flow: Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Frontend as SharePage<br/>React
    participant Axios as API Client
    participant Backend as Express
    participant Auth as Supabase Auth
    participant MongoDB as MongoDB
    participant Supabase as Supabase<br/>Storage

    User->>Frontend: Open /share/:shareId
    Frontend->>Axios: GET /api/shares/info/:shareId
    Axios->>Backend: HTTP GET

    Backend->>MongoDB: Share.findOne({ shareId })
    MongoDB->>Backend: return share doc

    Backend->>Backend: Check expiresAt < now?

    alt Share Expired
        Backend->>Supabase: deleteFileFromStorage
        Backend->>MongoDB: Share.deleteOne
        Backend->>Axios: return 404
        Axios->>Frontend: error response
        Frontend->>User: Show "Expired" message
    else Share Valid
        Backend->>Axios: return share metadata
        Axios->>Frontend: metadata (no content)
        Frontend->>Frontend: Render Share UI

        alt File Share
            Frontend->>User: Show file info<br/>- Name, Size, Type<br/>- Download Button
        else Text Share
            Frontend->>User: Show text preview
        end

        User->>Frontend: Enter password (if protected)
        User->>Frontend: Click View/Download

        Frontend->>Axios: POST /api/shares/view/:shareId
        Axios->>Backend: { password }

        Backend->>MongoDB: Share.findOne({ shareId })
        Backend->>Backend: Validate<br/>- Not expired<br/>- Password correct<br/>- One-time check<br/>- View count limit

        alt Validation Failed
            Backend->>Axios: return 403
            Axios->>Frontend: error
            Frontend->>User: Show error message
        else Validation Passed
            Backend->>MongoDB: Share.findOneAndUpdate<br/>{ $inc: viewCount }
            MongoDB->>Backend: return updated share

            Backend->>Axios: return content<br/>+ viewCount
            Axios->>Frontend: response

            alt File Content
                Frontend->>User: Provide download link<br/>via signed URL
                User->>Supabase: Download file
                Supabase->>User: File bytes
            else Text Content
                Frontend->>User: Display text<br/>Show copy button
            end

            alt One-Time View
                Backend->>Backend: setTimeout 100ms
                Backend->>Supabase: deleteFileFromStorage
                Backend->>MongoDB: Share.deleteOne
                Frontend->>User: Show "Link expired"<br/>for next access
            end
        end
    end
```

---

## 9. Database Relationships

```mermaid
graph LR
    subgraph Auth["Supabase Auth (PostgreSQL)"]
        USER["auth.users<br/>━━━━━━━━<br/>id: UUID<br/>email<br/>created_at"]
        PROFILE["public.profiles<br/>━━━━━━━━<br/>id: UUID<br/>display_name<br/>created_at"]
    end

    subgraph AppDB["MongoDB"]
        SHARE["Share Collection<br/>━━━━━━━━<br/>_id: ObjectId<br/>shareId: String ⭐<br/>userId: String?<br/>contentType<br/>textContent?<br/>fileName?<br/>fileUrl?<br/>storagePath?<br/>fileSize?<br/>password?<br/>isPasswordProtected<br/>isOneTimeView<br/>viewCount<br/>maxViewCount?<br/>createdAt<br/>expiresAt ⭐<br/>isExpired"]
    end

    subgraph Cloud["Supabase Storage"]
        BUCKET["Bucket: files<br/>━━━━━━━━<br/>Path: /shareId/fileName<br/>Data: Binary"]
    end

    USER -->|1:N| PROFILE
    PROFILE -->|FK| USER

    PROFILE -->|userId| SHARE
    SHARE -->|references| PROFILE

    SHARE -->|storagePath| BUCKET

    SHARE -->|Indexes:<br/>shareId UNIQUE<br/>userId<br/>expiresAt TTL| SHARE

    style USER fill:#e3f2fd
    style PROFILE fill:#e3f2fd
    style SHARE fill:#f3e5f5
    style BUCKET fill:#fff3e0
```

---

## 10. Error Handling Flow

```mermaid
graph TD
    A[Client Request] --> B{Validate Input}

    B -->|Invalid| C["400 Bad Request<br/>- File too large<br/>- Invalid parameters<br/>- Missing required fields"]

    B -->|Valid| D{Authenticate}

    D -->|Invalid Token| E["401 Unauthorized<br/>- Missing token<br/>- Expired token<br/>- Invalid signature"]

    D -->|Valid| F{Check Resource}

    F -->|Not Found| G["404 Not Found<br/>- Share expired<br/>- Share doesn't exist<br/>- Deleted by owner"]

    F -->|Found| H{Check Permissions}

    H -->|Insufficient| I["403 Forbidden<br/>- Delete without auth<br/>- Not share owner<br/>- One-time already viewed<br/>- Max views reached<br/>- Wrong password"]

    H -->|Allowed| J{Process Request}

    J -->|Success| K["200 OK / 201 Created<br/>Return data"]

    J -->|Error| L["500 Internal Server Error<br/>- DB connection failure<br/>- Storage upload failure<br/>- Unexpected error"]

    C --> M["Frontend Shows<br/>User-Friendly Message"]
    E --> M
    G --> M
    I --> M
    L --> M
    K --> N["Frontend Processes<br/>Success Response"]

    style C fill:#ffcdd2
    style E fill:#ffcdd2
    style G fill:#ffcdd2
    style I fill:#ffcdd2
    style L fill:#ffcdd2
    style K fill:#c8e6c9
    style N fill:#c8e6c9
```

---

## 11. State Machine: Share Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: User uploads

    Created --> Active: Share saved,<br/>Link generated

    Active --> Password_Protected: If password set
    Active --> Public: If no password

    Password_Protected --> Viewing: User enters<br/>correct password
    Public --> Viewing: User clicks view

    Viewing --> Incremented: viewCount++

    Incremented --> One_Time_Deleted: If isOneTimeView
    Incremented --> Counting: If not one-time

    One_Time_Deleted --> Deleted

    Counting --> View_Limited: If maxViewCount set
    Counting --> Unlimited: If no limit

    View_Limited --> Max_Views: viewCount >= maxViewCount
    Unlimited --> Active: User can view again
    Unlimited --> Expired: expiresAt passed

    Max_Views --> Deleted

    Active --> Expired: When expiresAt<br/>timestamp reached
    Active --> Manual_Delete: User deletes

    Password_Protected --> Manual_Delete
    Public --> Manual_Delete

    Expired --> Cleanup_Job: Job runs every 5 min
    Manual_Delete --> Delete_Storage: Delete from Supabase
    Cleanup_Job --> Delete_Storage

    Delete_Storage --> Delete_DB: Delete from MongoDB
    Delete_DB --> Deleted

    Deleted --> [*]: Permanently removed

    note right of Created
        MongoDB document created
        File uploaded to Supabase
        Unique shareId generated
    end note

    note right of Password_Protected
        User must provide
        correct password
        to access
    end note

    note right of Viewing
        viewCount incremented
        Content returned
        to user
    end note

    note right of One_Time_Deleted
        Immediate deletion
        after first view
        File + DB removed
    end note

    note right of Expired
        TTL index triggers
        Cleanup job runs
        Reactive cleanup on access
    end note
```

---

## 12. API Endpoints: Request/Response Flow

```mermaid
graph TD
    subgraph Upload["POST /api/shares/upload"]
        U1["Request: FormData<br/>- text OR file<br/>- password?<br/>- isOneTimeView?<br/>- expiryMinutes?<br/>- expiryDateTime?<br/>- maxViewCount?"]
        U2["Response 201:<br/>{<br/>&nbsp;shareId,<br/>&nbsp;shareUrl,<br/>&nbsp;expiresAt<br/>}"]
        U1 --> U2
    end

    subgraph View["POST /api/shares/view/:shareId"]
        V1["Request:<br/>{<br/>&nbsp;password?<br/>}"]
        V2["Response 200 TEXT:<br/>{<br/>&nbsp;content,<br/>&nbsp;viewCount<br/>}"]
        V3["Response 200 FILE:<br/>{<br/>&nbsp;fileUrl,<br/>&nbsp;fileSize,<br/>&nbsp;viewCount<br/>}"]
        V4["Response 403/404<br/>Unauthorized or<br/>Expired"]
        V1 --> V2
        V1 --> V3
        V1 --> V4
    end

    subgraph Info["GET /api/shares/info/:shareId"]
        I1["Request: None"]
        I2["Response 200:<br/>{<br/>&nbsp;shareId,<br/>&nbsp;contentType,<br/>&nbsp;fileName,<br/>&nbsp;isPasswordProtected,<br/>&nbsp;expiresAt,<br/>&nbsp;viewCount<br/>}"]
        I1 --> I2
    end

    subgraph Delete["DELETE /api/shares/delete/:shareId"]
        D1["Request: JWT Auth"]
        D2["Response 200:<br/>{<br/>&nbsp;message<br/>}"]
        D3["Response 401/403<br/>Unauthorized or<br/>Not Owner"]
        D1 --> D2
        D1 --> D3
    end

    subgraph UserShares["GET /api/shares/user-shares"]
        US1["Request: JWT Auth"]
        US2["Response 200:<br/>[<br/>&nbsp;{<br/>&nbsp;&nbsp;shareId,<br/>&nbsp;&nbsp;contentType,<br/>&nbsp;&nbsp;expiresAt,<br/>&nbsp;&nbsp;viewCount<br/>&nbsp;}<br/>]"]
        US1 --> US2
    end

    style Upload fill:#e3f2fd
    style View fill:#e8f5e9
    style Info fill:#fff3e0
    style Delete fill:#ffebee
    style UserShares fill:#f3e5f5
```

---

These Mermaid diagrams provide:

1. **Data Flow Upload** - Complete upload journey
2. **Data Flow View/Download** - Viewing and accessing shares
3. **Authentication** - Token and auth verification
4. **Cleanup Mechanisms** - Three parallel cleanup strategies
5. **Database Schema** - ER diagram of all data relationships
6. **System Architecture** - Component interactions
7. **Upload Sequence** - Detailed step-by-step process
8. **View/Access Sequence** - Complete access flow
9. **Database Relationships** - Entity relationships
10. **Error Handling** - Error scenarios and responses
11. **State Machine** - Share lifecycle from creation to deletion
12. **API Endpoints** - Request/response patterns

You can copy these directly into Mermaid Live Editor (https://mermaid.live) or include them in your documentation!
