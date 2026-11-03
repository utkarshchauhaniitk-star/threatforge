# ThreatForge — Threat Detection Rules & Correlation Logic

This document details the rule-based detection engine implemented within ThreatForge. Each rule is deterministic, explainable, and mapped to the [MITRE ATT&CK® Framework](https://attack.mitre.org/).

---

## Detection Rules Catalog

### Rule 1: Possible Brute Force Attack
* **Rule ID**: `RULE-BRUTEFORCE`
* **Default Severity**: `High`
* **MITRE ATT&CK**: [T1110.001 - Brute Force: Password Guessing](https://attack.mitre.org/techniques/T1110/001/)
* **Detection Logic**:
  Identifies repeated authentication failures targeting a specific account from an isolated source IP address within a tight sliding timeframe.
* **Default Parameters**:
  - `threshold`: 5 failed attempts
  - `window_minutes`: 15 minutes
* **Evaluation Query / Sliding Window**:
  Events matching `event_type == 'authentication'` and `status IN ('failure', 'denied', 'attempt')` are grouped by `(source_ip, username)`. If $\ge 5$ matching events fall within a 15-minute sliding window, an alert is raised.
* **Alert Title**: `Possible Brute Force Attack`
* **Potential False Positives**:
  - An employee who recently changed their domain password while a stale mobile client or background application attempts automatic authentication with old cached credentials.
* **Analyst Remediation**:
  - Verify whether the source IP belongs to corporate IP ranges or VPN egress points.
  - Temporarily throttle or block source IP at perimeter firewall.
  - Enforce password reset and check for account lockouts.

---

### Rule 2: Suspicious Login Activity
* **Rule ID**: `RULE-SUSP-LOGIN`
* **Default Severity**: `Medium`
* **MITRE ATT&CK**: [T1078 - Valid Accounts](https://attack.mitre.org/techniques/T1078/)
* **Detection Logic**:
  Detects two suspicious authentication patterns:
  1. **Credential Breakthrough**: A successful login immediately preceded by multiple authentication failures from the same source IP within a short window (suggesting successful password cracking or credential guessing).
  2. **High-Risk / Orphan Account Targeting**: Login attempts directed against known vulnerable or dormant generic accounts (e.g. `guest`, `test`, `temp`, `anonymous`, `backup`, `support`).
* **Default Parameters**:
  - `failure_threshold_before_success`: 2 failures
  - `window_minutes`: 15 minutes
* **Evaluation Query**:
  Checks sequential timestamps per `source_ip`. If `status == 'success'` and prior events in the preceding 15 minutes contain $\ge 2$ failures, a credential breakthrough alert triggers.
* **Alert Title**: `Suspicious Login Activity`
* **Potential False Positives**:
  - A user who legitimately mistyped their password twice before entering the correct one.
* **Analyst Remediation**:
  - Verify multi-factor authentication (MFA) logs for that session.
  - Confirm user identity via secondary communication channel.

---

### Rule 3: Multiple Account Password Spray Attempt
* **Rule ID**: `RULE-SPRAY`
* **Default Severity**: `High`
* **MITRE ATT&CK**: [T1110.003 - Brute Force: Password Spraying](https://attack.mitre.org/techniques/T1110/003/)
* **Detection Logic**:
  Adversaries often attempt a single common password across many different user accounts to circumvent individual account lockout thresholds. This rule flags a single external source IP attempting authentication against numerous distinct accounts.
* **Default Parameters**:
  - `distinct_users_threshold`: 3 distinct usernames
  - `window_minutes`: 30 minutes
* **Evaluation Query**:
  Groups failed authentication events by `source_ip`. Calculates `count(DISTINCT username)` within a 30-minute window. If count $\ge 3$, an alert triggers.
* **Alert Title**: `Multiple Account Password Spray Attempt`
* **Potential False Positives**:
  - Corporate single sign-on (SSO) proxies or network address translation (NAT) gateways aggregating failed logins from multiple distinct internal employees.
* **Analyst Remediation**:
  - Block source IP at external edge proxy or web application firewall (WAF).
  - Search global logs for any successful logins originating from the same IP address during the spray window.

---

### Rule 4: Unusual Privileged Activity
* **Rule ID**: `RULE-PRIV-ACTION`
* **Default Severity**: `Critical`
* **MITRE ATT&CK**: [T1078.001 - Default Accounts](https://attack.mitre.org/techniques/T1078/001/) / [T1068 - Privilege Escalation](https://attack.mitre.org/techniques/T1068/)
* **Detection Logic**:
  Monitors authorization telemetry for unauthorized administrative commands, sudo privilege escalations, root elevation rejections, or attempts to read protected system credential vaults (such as `/etc/shadow` or registry hives).
* **Default Parameters**:
  - Monitored actions: `privilege_escalation`, `sudo`, `user_add`, `role_change`, `permission_grant`
* **Evaluation Query**:
  Triggers on authorization events where the action matches monitored privilege verbs and the outcome is `failure`, `denied`, or assigned `critical` severity.
* **Alert Title**: `Unusual Privileged Activity Detected`
* **Potential False Positives**:
  - System administrators or DevOps engineers making routine configuration updates or typo'ing a sudo password.
* **Analyst Remediation**:
  - Verify with the account owner if the command was part of an approved change ticket.
  - Review terminal process trees and command history around the event timestamp.

---

### Rule 5: Suspicious Connection Burst / Traffic Anomaly
* **Rule ID**: `RULE-TRAFFIC-BURST`
* **Default Severity**: `Medium`
* **MITRE ATT&CK**: [T1046 - Network Service Discovery](https://attack.mitre.org/techniques/T1046/)
* **Detection Logic**:
  Detects an elevated rate of denied or dropped network packets originating from a single IP, characteristic of port scanning, network mapping, or automated reconnaissance tools (e.g. Nmap, Masscan).
* **Default Parameters**:
  - `denial_threshold`: 10 denied connections
  - `window_minutes`: 10 minutes
* **Evaluation Query**:
  Groups events where `event_type IN ('network', 'firewall')` and `status IN ('denied', 'failure', 'blocked')` by `source_ip`. If $\ge 10$ events occur in 10 minutes, triggers an alert.
* **Alert Title**: `Suspicious Connection Burst / Traffic Anomaly`
* **Potential False Positives**:
  - Misconfigured internal application or monitoring agent attempting to poll a decommissioned port or service.
* **Analyst Remediation**:
  - Examine destination ports probed to characterize threat intent (e.g., port 22 SSH vs. 3389 RDP vs. 445 SMB).
  - Apply automated rate-limiting or boundary IP blocking.
