# Component Diagram

This C4-style component diagram illustrates the layered architecture of the Playlistify application.

```mermaid
graph TD
    subgraph "Playlistify Application"
        direction TB

        subgraph "Frontend (Renderer Process)"
            direction LR
            style Frontend fill:#D6EAF8,stroke:#3498DB
            
            UI_Pages["Pages & Components<br/>(React, TanStack Router)"]
            State_Management["State Management<br/>(Zustand, TanStack Query)"]
            
            UI_Pages --> State_Management
            State_Management -- "Calls API via Preload" --> IPC_Contract
        end

        subgraph "Backend (Main Process)"
            direction TB
            style Backend fill:#D5F5E3,stroke:#2ECC71

            IPC_Contract["Typed IPC Contract<br/>(src/shared/ipc-contract.ts)"]
            
            subgraph "Service Layer"
                direction TB
                PS[PlaylistService]
                DS[DownloadService]
                HS[HealthCheckService]
            end
            
            subgraph "Repository Layer (DAL)"
                direction TB
                PR[PlaylistRepository]
                VR[VideoRepository]
                BTR[BackgroundTaskRepository]
                SA[SQLiteAdapter]
                
                PR --> SA
                VR --> SA
                BTR --> SA
            end
            
            IPC_Contract --> PS
            IPC_Contract --> DS
            IPC_Contract --> HS
            
            PS --> PR
            PS --> VR
            DS --> BTR
            HS --> VR
        end

        subgraph "Data Store"
            style Data_Store fill:#FDEDEC,stroke:#E74C3C
            DB[(SQLite Database<br/>database.sqlite)]
            SA -- "SQL Queries" --> DB
        end
        
        subgraph "External Tool Wrappers (in Service Layer)"
            style External_Tool_Wrappers fill:#FCF3CF,stroke:#F1C40F
            YTDLP_Service[ytDlpService]
            FFMPEG_Service[ffmpegService]
            
            DS --> YTDLP_Service
            DS --> FFMPEG_Service
            HS --> YTDLP_Service
        end
    end

    subgraph "External Systems"
        style External_Systems fill:#EAECEE,stroke:#7F8C8D
        YTDLP[yt-dlp binary]
        FFMPEG[ffmpeg binary]
        YouTube_API[YouTube Data API]
        
        YTDLP_Service -- "Spawns Process" --> YTDLP
        FFMPEG_Service -- "Spawns Process" --> FFMPEG
        PS -- "HTTP Requests" --> YouTube_API
    end