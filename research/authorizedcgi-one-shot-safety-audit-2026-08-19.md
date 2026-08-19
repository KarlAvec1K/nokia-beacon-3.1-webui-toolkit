# Authorized-CGI one-shot safety audit — 2026-08-19

## Purpose

This script classifies every unique entry returned by `capabilities_status_web_app.cgi` and probes only a strict read-only subset.

## Safety policy

The script:

- loads the authorized list once;
- rejects mutator-looking names and unknown query forms;
- rejects cross-origin entries;
- sends sequential GET requests only to strict status/info/capability paths;
- cancels response bodies immediately;
- uses status, redirect, and timing metadata only;
- never sends POST, PUT, PATCH, or DELETE.

## First stable result

The current normal-admin list contains 146 unique entries. The first one-shot pass tested 35 strict reads: 34 returned HTTP 200 and the radio receiver path timed out.

A later phase-2 pass expanded the proven read set to 41 entries. See the phase-2 report for the corrected final baseline.

Skipped entries are not necessarily unauthorized. They were skipped because their URL alone did not prove a harmless read.
