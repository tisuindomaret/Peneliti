# Low-Fidelity Wireframes

This document provides text-based, low-fidelity wireframes for the key screens of the Research Permit Licensing Web Application as outlined in Phase 1.

---

## 1. Registration / Login

**Path:** `/register`, `/login`

```text
======================================================
[ Logo ]  Research Permit System
======================================================

          [ LOGIN ]                 [ REGISTER ]

  Email:    [________________]    Name:     [________________]
  Password: [________________]    Email:    [________________]
                                  Phone:    [________________]
  [ LOGIN ]                       Type:     (o) Individual ( ) Institution

  Forgot Password?                Password: [________________]
                                  Confirm:  [________________]

                                  [ REGISTER ]
======================================================
```

---

## 2. Applicant Dashboard

**Path:** `/dashboard` (Role: Applicant)

```text
======================================================
[ Logo ]  |  My Applications  |  Profile  |  [Logout]
======================================================
Welcome, [Applicant Name]

[ + New Application ]

Active Applications
------------------------------------------------------
ID         Title                 Type       Status        Action
APP-123    Water Quality...      Research   Draft         [Resume]
APP-121    Soil Sample...        Survey     In Review     [View]
APP-119    Traffic Study         Research   Needs Rev.    [Edit]

Issued Permits (Requires Output)
------------------------------------------------------
Permit No.    Title              Valid Until    Status
PER-22-001    Forest Flora       2023-12-31     [Upload Output]
======================================================
```

---

## 3. Application Form (Multi-step)

**Path:** `/applications/new` or `/applications/{id}/edit`

```text
======================================================
[ Logo ]  |  Dashboard  |  Profile  |  [Logout]
======================================================
Draft Application: APP-123

Step 1: General Info > Step 2: Research Details > Step 3: Documents

Research Title:       [_________________________________]
Permit Type:          [ Dropdown: Research Permit v ]
Field/Topic:          [ Dropdown v ]
Location:             [_________________________________]
Period Start:         [ YYYY-MM-DD ]   End: [ YYYY-MM-DD ]

[ < Back ]  [ Save Draft ]  [ Next > ]
======================================================
```

---

## 4. Document Upload

**Path:** `/applications/{id}/documents` (Step 3 of Form)

```text
======================================================
Draft Application: APP-123 - Documents

Please upload the required documents for [Permit Type].

Mandatory:
1. Research Proposal (PDF, max 5MB)
   [ Choose File ]  (Status: Pending)

2. ID Card (KTP/Passport) (JPG/PDF, max 2MB)
   [ file_uploaded.pdf (x) ] (Status: Uploaded)

Optional:
3. Ethical Clearance (PDF, max 2MB)
   [ Choose File ]

[ < Back ]  [ Save Draft ]  [ Submit Application ]
======================================================
```

---

## 5. Verifier Queue

**Path:** `/admin/queue` (Role: Verifier)

```text
======================================================
[ Logo ]  |  Queue  |  Reports  |  [User Name]
======================================================
Verifier Queue

Filters: Status [All v]  Type [All v]  Date [___ to ___]

ID         Applicant       Type       Submitted Date  Status       Action
APP-124    Jane Doe        Research   2023-10-24      Submitted    [Review]
APP-122    Acme Univ       Survey     2023-10-22      Admin Rev.   [Review]
APP-120    John Smith      Research   2023-10-20      Resubmitted  [Review]

<< 1 2 3 >>
======================================================
```

---

## 6. Review Screen

**Path:** `/admin/applications/{id}/review` (Role: Verifier)

```text
======================================================
Reviewing: APP-124

[Applicant Info]  |  [Application Data]  |  [Audit Log]

Documents Checklist:
[v] Research Proposal  [ View ]  | Note: [________]
[v] ID Card            [ View ]  | Note: [________]

Verification Decision:
( ) Mark as Administratively Complete (Proceed to Substantive)
( ) Request Revision
    Revision Notes: [_________________________________]
                    [_________________________________]

[ Submit Decision ]
======================================================
```

---

## 7. Official's Decision Screen

**Path:** `/admin/applications/{id}/decision` (Role: Official)

```text
======================================================
Approval Decision: APP-124

Summary:
Applicant: Jane Doe
Title: Water Quality in River X
Type: Research Permit
Verifier Recommendation: Proceed to Approval

Decision:
( ) Approve and Issue Permit
    Conditions/Terms: [_____________________________]

( ) Reject
    Reason: [_______________________________________]

[ Confirm Decision ]
======================================================
```

---

## 8. Permit PDF Preview (Conceptual Layout)

**Path:** `/permits/{id}`

```text
======================================================
[ Institution Header & Logo ]
------------------------------------------------------
PERMIT DOCUMENT
Number: {PERMIT_NUMBER}

This permit is granted to:
Name: {APPLICANT_NAME}
Institution: {INSTITUTION_NAME}

To conduct research titled: "{RESEARCH_TITLE}"
Location: {LOCATION}
Valid from: {START_DATE} to {END_DATE}

Conditions:
{CONDITIONS}

[ QR CODE HERE ]
(Scan to verify authenticity)

Issued on: {ISSUE_DATE}
Authorized Official: {OFFICIAL_NAME}
======================================================
```

---

## 9. Public Verification Page

**Path:** `/verify/{permit_number}` (Public access)

```text
======================================================
[ Institution Logo ] Permit Verification
======================================================
Search: [ Permit Number ] [ Check ]

Result for: PER-22-001

Status: [ VALID / ACTIVE ] (Green Badge)

Permit Details:
Permit Number:   PER-22-001
Applicant:       Jane Doe (Institution X)
Research Title:  Flora study in Region Y
Valid Period:    2023-01-01 to 2023-12-31

(Note: Sensitive personal info like phone/email is hidden)
======================================================
```

---

## 10. Research Output Upload

**Path:** `/permits/{id}/outputs/new` (Role: Applicant)

```text
======================================================
Submit Research Output for PER-22-001

Title of Output:    [_______________________________]
Authors:            [_______________________________]
Year:               [ 2023 ]
Abstract:           [_______________________________]
                    [_______________________________]
Access Classification: [ Dropdown: Internal / Public ]

Upload Document(s):
[ Choose File ] (PDF max 10MB)

External Link (if applicable):
[_______________________________]

[ Submit Output ]
======================================================
```

---

## 11. Output Review Screen

**Path:** `/admin/outputs/{id}/review` (Role: Output Reviewer)

```text
======================================================
Reviewing Output for Permit: PER-22-001

Output Title: "Flora study results 2023"
File: [ Download ]

Review Decision:
( ) Accept for Archive
( ) Request Revision
    Notes: [______________________________]
( ) Reject
    Reason: [_____________________________]

[ Submit Review ]
======================================================
```

---

## 12. Admin Configuration Screens

**Path:** `/admin/config/permit-types` (Role: Admin)

```text
======================================================
[ Logo ]  |  Users  |  Permit Types  |  Settings
======================================================
Manage Permit Types

[ + Add New Permit Type ]

Name             Validity (Days)  Status   Action
Research Permit  365              Active   [Edit] [Deactivate]
Survey Permit    90               Active   [Edit] [Deactivate]

--- Editing "Research Permit" ---
Name: [ Research Permit ]
Numbering Pattern: [ APP/RES/{YYYY}/{SEQ} ]
Validity Days: [ 365 ]

Requirements Checklist:
1. Research Proposal (Mandatory) [x]
2. ID Card (Mandatory) [x]
[ + Add Requirement ]

[ Save Changes ]
======================================================
```

---

## 13. Admin Dashboard

**Path:** `/admin/dashboard` (Role: Admin / Official)

```text
======================================================
[ Logo ]  |  Dashboard  |  Users  |  Queue  |  Reports
======================================================
System Overview

[ Total Apps ]  [ Active Permits ]  [ Expiring <30d ]
    1,245             430                  24

Processing Time Average: 3.2 Days
Output Compliance Rate: 85%

Recent Activity Log:
- 10:05 AM: Jane Doe submitted APP-125
- 09:45 AM: Official X approved APP-120
- 09:10 AM: System sent reminder for PER-21-099
======================================================
```
