# CPRS GUI Analysis for ModernVista

## Overview
Analysis of CPRS Windows GUI source code found in `vista-source/Packages/Order Entry Results Reporting/CPRS/CPRS-Chart/` to inform ModernVista's modern web-based implementation.

## Key Source Files Analyzed

### Patient Selection (`fPtSel.pas`)
- **Main Form**: `TfrmPtSel` - Patient selection dialog with combo box
- **Patient List Sources**: 
  - Provider patients (`TAG_SRC_PROV`)
  - Team patients (`TAG_SRC_TEAM`) 
  - Specialty patients (`TAG_SRC_SPEC`)
  - Clinic patients (`TAG_SRC_CLIN`)
  - Ward patients (`TAG_SRC_WARD`)
  - PCMM Team (`TAG_SRC_PCMM`)
  - All patients (`TAG_SRC_ALL`)
- **Search Methods**:
  - Last 5 SSN digits via `ListPtByLast5()`
  - Full SSN via `ListPtByFullSSN()`
  - Real-time autocomplete with `cboPatient.InitLongList()`
- **Patient ID Format**: Uses DFN (Data File Number) as primary key

### Main Application Frame (`fFrame.pas`)
- **Layout Structure**:
  - Top toolbar panel (`pnlToolbar`)
  - Patient info panel (`pnlPatient`) with name/SSN display
  - Visit info panel (`pnlVisit`) with location/provider
  - Primary care panel (`pnlPrimaryCare`) 
  - Tab control for different modules (`tabPage`)
  - Status bar at bottom (`stsArea`)
- **Menu Structure**: File, Edit, View, Tools, Help with module-specific items
- **Responsive Elements**: Splitters and auto-sizing panels

### Patient Demographics (`mPtSelDemog.pas`)
- **Demographics Display**: Frame showing patient details in grid layout
- **Data Fields**:
  - SSN, DOB, Sex/Age, Veteran status
  - Service connection, Location, Room/Bed
  - Primary provider, Attending, Combat veteran status
  - Last visit location and date
- **Layout**: Uses `TGridPanel` for responsive layout
- **Real-time Updates**: `ShowDemog(ItemID: string)` for patient changes

## CPRS Design Patterns

### 1. **Patient-Centric Workflow**
- Patient selection is primary entry point
- All modules revolve around selected patient context
- Patient info always visible in header

### 2. **Tabbed Module Architecture** 
- Cover Sheet, Orders, Notes, Consults, Labs, Reports, Meds, Problems
- Each tab is separate form with consistent interface
- Shared patient context across all tabs

### 3. **RPC Communication Pattern**
```pascal
// Example from rCore.pas
procedure SelectPatient(const DFN: string; var PtSelect: TPtSelect);
// Uses VistA RPC calls like 'ORWPT SELECT'
```

### 4. **Three-Panel Layout**
- Left: Navigation/selection (patient lists, trees)
- Center: Main content (orders, notes, results) 
- Right: Details/actions (patient info, order details)

### 5. **Search and Filter Patterns**
- Incremental search with auto-complete
- Multiple search methods (name, SSN, provider, etc.)
- Long list support with paging for large datasets

## ModernVista Implementation Strategy

### Modernization Approach
1. **Web-First Design**: React components instead of Delphi forms
2. **RESTful APIs**: Replace RPC calls with modern HTTP endpoints
3. **Responsive Layout**: CSS Grid/Flexbox instead of fixed panels
4. **Real-time Updates**: WebSocket for live data vs polling
5. **Progressive Enhancement**: Offline capability with service workers

### Component Mapping

| CPRS Component | ModernVista Equivalent |
|----------------|------------------------|
| `TfrmPtSel` | `PatientSearch.tsx` component |
| `TfrmFrame` | `MinimalShell.tsx` layout |
| `TfraPtSelDemog` | Patient info sidebar |
| `TTabControl` | React Router navigation |
| VistA RPC calls | REST API endpoints |

### UI/UX Improvements
1. **Search Enhancement**: 
   - Fuzzy matching, typo tolerance
   - Smart suggestions based on context
   - Recent patients quick access
2. **Visual Hierarchy**:
   - Clean typography, consistent spacing
   - Color coding for patient status/alerts
   - Modern iconography
3. **Accessibility**:
   - ARIA labels, keyboard navigation
   - Screen reader compatibility
   - High contrast mode support

## Technical Insights

### VistA Integration Points
- Patient lookup via `ORWPT LIST ALL` RPC
- Demographics via `ORWPT SELECT` 
- Authentication through VistA security
- Alert/notification system integration

### Performance Considerations
- CPRS uses long lists with pagination for patient searches
- Caching of frequent lookups (providers, locations)
- Background loading of patient context

### Security Model
- User authentication through VistA
- Role-based access to patient records
- Audit trail for all patient access

## Implementation Priorities

### Phase 1: Patient Selection POC
- [x] Basic patient search API endpoint
- [ ] Frontend patient search component  
- [ ] Patient demographics display
- [ ] Selection state management

### Phase 2: Main Framework
- [ ] Application shell with navigation
- [ ] Patient context provider
- [ ] Module routing structure
- [ ] Authentication integration

### Phase 3: Core Modules
- [ ] Cover sheet dashboard
- [ ] Orders management
- [ ] Notes and documentation
- [ ] Lab results display

This analysis provides the foundation for creating a modern, web-based interface that maintains CPRS's proven workflow patterns while leveraging contemporary web technologies for better usability and maintainability.