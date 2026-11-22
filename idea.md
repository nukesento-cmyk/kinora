# KINORA — MASTER PRODUCT & ENGINEERING INSTRUCTIONS

## 1. PROJECT MISSION

Build KINORA, a premium, global social discovery and relationship platform centered on people of short stature.

KINORA must enable people of all heights to connect through:

- Dating and romantic relationships.
- Friendships and social discovery.
- Community groups and discussions.
- Events and real-world meetups.
- Professional networking.
- Educational and business opportunities.
- Global community participation.

This is not simply a dating application. It is a comprehensive social ecosystem.

**Brand:** KINORA (working name; keep all branding configurable until trademark and domain checks are completed).

**Brand positioning:** A world where everyone belongs, and meaningful connections have no boundaries.

**Primary audience:** Adults of short stature.

**Additional audience:** People of all heights who want genuine, respectful connections, families, allies, organizations and community partners.

**Initial age restriction:** 18+.

The platform must be inclusive without compromising the safety, dignity, privacy and ownership of its primary community.

---

## 2. NON-NEGOTIABLE DEVELOPMENT RULES

1. Inspect the existing repository before writing or modifying code.
2. Never recreate functionality that already exists.
3. Do not replace working implementations merely because another implementation is easier.
4. Preserve existing architectural decisions unless there is a documented technical reason to change them.
5. Never create duplicate components, utilities, database tables, API endpoints or configuration files.
6. Search the codebase before introducing any new dependency.
7. Reuse existing components, hooks, services and design tokens.
8. Never use mock data as a substitute for real functionality in production-facing features.
9. Mock data may be used in isolated development fixtures and automated tests.
10. Every feature must have validation, loading states, empty states, error states and appropriate permissions.
11. Every database change must have a migration.
12. Never silently discard existing data.
13. Never expose secrets, credentials, private documents or sensitive member information.
14. Keep environment-specific configuration in environment variables.
15. Do not hardcode phone numbers, email addresses, payment credentials, URLs, API keys or business contact information.
16. Write maintainable, modular and strongly typed code.
17. Avoid unnecessary abstractions and premature microservices.
18. Test existing functionality after every significant change.
19. Do not mark a feature complete simply because its interface has been implemented.
20. Maintain a clear implementation and testing record.

Do not blindly follow these instructions when they conflict with an existing, documented project decision. Inspect, identify the conflict and document the recommended resolution.

## 3. DEVELOPMENT WORKFLOW

Before implementation:

- Inspect the entire repository structure.
- Read README.md, package.json, configuration files and existing documentation.
- Inspect database schemas and migrations.
- Inspect authentication and authorization.
- Review existing UI components.
- Identify implemented, partially implemented and missing features.
- Run the existing application and test suite.
- Identify broken functionality and architectural risks.

Create or update:

- README.md
- PROJECT_STATUS.md
- IMPLEMENTATION_PLAN.md
- ARCHITECTURE.md
- DATABASE.md
- SECURITY.md
- API.md
- TESTING.md
- TODO.md
- CHANGELOG.md

Documentation must describe the actual implementation, not an imagined future architecture.

### Agent utilization

Use Claude Code agents where available.

Assign independent workstreams such as:

- Architecture and codebase analysis.
- UI/UX and design system.
- Database and backend.
- Authentication and security.
- Testing and quality assurance.

Have the lead agent coordinate shared interfaces and integration.

Do not allow multiple agents to modify the same files simultaneously without coordination.

Avoid unnecessary parallelization when tasks depend on one another.

### Token efficiency

- Read only the relevant files before making changes.
- Use targeted searches rather than repeatedly reading the entire repository.
- Reuse existing code.
- Avoid regenerating files that are already correct.
- Batch independent research and inspection tasks.
- Run focused tests during development and broader tests at milestones.
- Avoid unnecessary explanations in tool outputs.
- Keep a concise progress log.
- Do not repeatedly rediscover decisions documented in project files.

Before each major phase, establish what is already implemented and what remains.

---

## 4. TECHNOLOGY STACK

Use the following preferred stack unless the existing project has a justified equivalent.

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Motion for animations
- Responsive, mobile-first design

### Mobile
- React Native
- Expo

Mobile applications should be developed after establishing stable API contracts and core web functionality.

### Backend
- Next.js application backend initially.
- Modular service architecture.
- REST APIs or appropriately structured server actions.
- Background processing for asynchronous tasks.

### Database
- PostgreSQL
- Drizzle ORM
- drizzle-zod where appropriate
- Zod validation

Do not introduce Prisma or another ORM without an explicit architectural justification.

### Infrastructure
- Managed authentication provider.
- S3-compatible object storage.
- Realtime messaging infrastructure.
- CDN.
- Background job processing.
- Transactional email provider.
- Push notification infrastructure.

### Testing
- Vitest.
- Playwright.
- TypeScript checks.
- ESLint.
- Automated database migration checks.
- GitHub Actions CI/CD.

Select exact providers after researching current capabilities, pricing, regional availability, security and integration requirements.

Avoid unnecessary dependencies.

---

## 5. PRODUCT ARCHITECTURE

Build a modular monolith with clearly separated domains.

The following domains must be independently organized:

1. Identity and authentication.
2. Member profiles.
3. Verification.
4. Discovery.
5. Dating and matching.
6. Friendship and connections.
7. Social feed.
8. Community groups.
9. Messaging.
10. Events.
11. Organizations.
12. Professional opportunities.
13. Notifications.
14. Subscriptions and payments.
15. Trust and safety.
16. Administration.
17. Analytics.

Each domain should have clearly defined responsibilities, validation, services, permissions and data-access boundaries.

Avoid tightly coupling business logic to UI components.

Design for future mobile clients and external integrations.

Do not start with microservices.

---

## 6. BRAND AND DESIGN DIRECTION

Create a premium, welcoming and internationally recognizable identity.

The platform should feel like a world-class social network, not an old-fashioned dating website or medical support portal.

### Design characteristics

- Premium visual identity.
- Clean typography.
- Strong visual hierarchy.
- Elegant animations.
- Beautiful profile cards.
- Intuitive discovery experiences.
- Modern navigation.
- Thoughtful empty states.
- Accessible color contrast.
- Responsive layouts.
- Consistent design tokens.

Explore a distinctive visual identity using sophisticated neutral surfaces and a recognizable accent palette.

Avoid excessive gradients, unnecessary glass effects, cluttered dashboards and generic template aesthetics.

Do not rely on emojis for primary navigation or branding.

### Brand language

Use welcoming, respectful and empowering language.

Avoid dehumanizing labels, objectifying descriptions and language that treats people of short stature as attractions.

Do not use public labels such as normal versus outsider.

All branding, logos, colors, copy and contact information must be configurable.

---

## 7. PUBLIC WEBSITE

Build the following public pages:

- Home.
- About.
- Discover.
- Dating.
- Community.
- Events.
- Stories.
- Safety.
- Membership and Pricing.
- Help and FAQs.
- Contact.
- Registration.
- Login.
- Privacy Policy.
- Terms of Service.
- Community Guidelines.

### Homepage requirements

The homepage must communicate:

1. What KINORA is.
2. Who it serves.
3. Why it exists.
4. How people connect.
5. The available experiences.
6. Community safety and inclusion.
7. Membership benefits.
8. A strong registration call to action.

Include compelling visual storytelling, real product previews, responsive sections and carefully designed animations.

Do not use fabricated testimonials, fabricated statistics or unauthorized photographs.

---

## 8. AUTHENTICATION AND ONBOARDING

Implement:

- Email registration.
- Secure authentication.
- Password recovery.
- Supported social login where appropriate.
- Email verification.
- Session management.
- Account security settings.
- Adult age eligibility checks.
- Account deletion.
- Data export workflows.

### Onboarding

Create a guided onboarding process.

Collect only information necessary to provide the service.

Members should be able to configure:

- Display name.
- Date of birth or appropriate age-verification information.
- Country.
- Optional city.
- Languages.
- Biography.
- Profile photographs.
- Interests.
- Hobbies.
- Connection intentions.
- Discovery preferences.
- Privacy preferences.

Allow members to identify voluntarily as people of short stature, interested members, family members or allies.

Never require someone to provide a medical diagnosis or disclose medical records to use the platform.

Verification must not become a discriminatory eligibility test.

Provide clear explanations of how sensitive information is handled.

---

## 9. MEMBER PROFILES

Develop complete member profiles.

Include:

- Profile photograph.
- Additional photographs.
- Display name.
- Age.
- Biography.
- Country.
- Optional city.
- Languages.
- Interests.
- Hobbies.
- Connection intentions.
- Optional introduction video.
- Verification indicators.
- Privacy settings.

Support editing, visibility controls and account-level preferences.

Implement secure image uploads with file validation, size limits, access controls and appropriate image processing.

Private photographs must not be publicly accessible through predictable storage URLs.

---

## 10. DISCOVERY ENGINE

Build a real discovery system.

Members must be able to discover:

- People nearby.
- People worldwide.
- People with common interests.
- Potential friends.
- Potential dating partners.
- Communities.
- Events.

Support filters for:

- Country.
- City or distance range.
- Age range.
- Languages.
- Interests.
- Connection intentions.
- User-selected compatibility preferences.

Location-based discovery must use approximate locations.

Never expose exact coordinates, residential addresses or continuous tracking.

Provide controls to disable nearby discovery.

Avoid arbitrary popularity rankings and discriminatory recommendation systems.

Implement pagination or cursor-based loading, indexing and efficient database queries.

---

## 11. DATING AND MATCHING

Dating must be a complete product experience.

Implement:

- Dating profiles.
- Relationship intentions.
- Likes.
- Passes.
- Mutual matches.
- Match notifications.
- Compatibility recommendations.
- Match management.
- Unmatching.
- Blocking.
- Reporting.

Relationship intentions must include:

- Long-term relationship.
- Marriage-oriented dating.
- Casual dating.
- Getting to know people.
- Friendship first.
- Undecided.

Matching must respect both parties' preferences and communication permissions.

Never rank members according to physical characteristics.

Do not infer medical conditions, attractiveness or sexual preferences from photographs.

Users must be able to understand and adjust recommendation preferences.

---

## 12. COMMUNITY AND SOCIAL FEED

Implement a fully functional social platform.

Features:

- Create posts.
- Edit posts.
- Delete posts.
- Upload photographs.
- Upload videos where supported.
- Comments.
- Replies.
- Reactions.
- Sharing controls.
- Reporting.
- Community announcements.
- Stories.
- Polls.
- Group discussions.

### Community categories

Create configurable communities covering:

- Life experiences.
- Dating and relationships.
- Parenting and family.
- Travel.
- Fashion.
- Fitness and recreation.
- Business.
- Education.
- Careers.
- Entertainment.
- Health and wellbeing.
- Country-based communities.

Support public, private and approval-based communities.

Community owners should have moderation and membership-management permissions.

---

## 13. MESSAGING AND COMMUNICATION

Implement:

- One-to-one conversations.
- Group conversations.
- Message requests.
- Text messages.
- Image sharing.
- Voice notes.
- Read receipts.
- Delivery indicators.
- Conversation controls.
- Blocking.
- Reporting.
- Notifications.

Design a reliable realtime messaging architecture.

Implement rate limits, spam protection and anti-harassment controls.

Prevent unauthorized messaging.

Video and audio calls may be introduced after the messaging foundation is stable.

Never claim end-to-end encryption unless it has actually been implemented and independently assessed.

---

## 14. EVENTS AND MEETUPS

Create a complete event-management module.

Support:

- Event creation.
- Event editing.
- Event cancellation.
- Event approval where necessary.
- Public and private events.
- Virtual events.
- Physical events.
- Event categories.
- Venue information.
- Date and time zones.
- RSVP.
- Attendee management.
- Ticketing readiness.
- Organizer profiles.
- Event reporting.

Physical events must include appropriate attendee-safety controls.

Support community meetups, dating events, social gatherings, conferences and recreational activities.

---

## 15. ORGANIZATIONS AND OPPORTUNITIES

Support verified organization accounts.

Organizations should be able to:

- Create an organization profile.
- Submit verification documents.
- Manage authorized representatives.
- Publish approved events.
- Publish opportunities.
- Manage public information.
- Receive inquiries through controlled channels.

Opportunity categories:

- Employment.
- Mentorship.
- Entrepreneurship.
- Education.
- Scholarships.
- Community partnerships.
- Advocacy.
- Professional networking.

Do not give organizations unrestricted access to member profiles, private communications or member databases.

---

## 16. TRUST, SAFETY AND MODERATION

This is a foundational requirement.

Implement:

- Age eligibility enforcement.
- Identity verification integrations.
- Optional liveness verification.
- Member reporting.
- Profile reporting.
- Message reporting.
- Content reporting.
- Blocking.
- Moderation queues.
- Moderator assignments.
- Case histories.
- Enforcement actions.
- Appeals.
- Suspensions.
- Account restrictions.
- Spam detection.
- Rate limiting.
- Audit logs.

Create clear moderation categories for:

- Harassment.
- Hate and discrimination.
- Objectification and fetishization.
- Sexual exploitation.
- Impersonation.
- Scams.
- Stalking.
- Threats.
- Non-consensual image sharing.
- Spam.

Automated moderation must support human review rather than replacing it.

Build a staff dashboard with granular permissions.

Keep sensitive identity evidence separate from ordinary member data.

Apply retention limits and deletion policies to verification documents.

Implement privacy-by-design and data minimization.

---

## 17. MONETIZATION

Use a freemium business model.

### Free membership

- Account creation.
- Profile.
- Basic discovery.
- Community participation.
- Basic mutual matching.
- Basic messaging subject to safeguards.
- Public event discovery.

### KINORA Plus

Proposed price: $7.99–$12.99 monthly.

Potential features:

- Advanced discovery filters.
- Expanded discovery limits.
- Incoming likes.
- Advanced preferences.
- Additional customization.
- Enhanced recommendations.

### KINORA Premium

Proposed price: $14.99–$19.99 monthly.

Potential features:

- All Plus benefits.
- Optional profile boosts.
- Advanced discovery.
- Premium event benefits.
- Additional personalization.

All prices must be configurable and support regional pricing.

Implement:

- Subscription plans.
- Checkout.
- Payment webhooks.
- Subscription lifecycle.
- Renewals.
- Cancellations.
- Refund workflows.
- Payment history.
- Invoices.
- Entitlement management.

Use idempotent payment processing and secure webhook verification.

Do not grant paid entitlements based solely on frontend confirmation.

Keep payment processing independent of member identity verification.

Other revenue opportunities include ticketing, sponsorships and organization subscriptions.

Never sell sensitive member data.

---

## 18. GLOBAL COMMUNITY MAP

Develop an interactive global community discovery experience.

Show:

- Countries with active communities.
- City-level community presence where safe.
- Public events.
- International groups.
- Virtual gatherings.

Use aggregated geographic information.

Never display individual members' exact locations.

Make the map accessible and usable on mobile.

---

## 19. AI CAPABILITIES

Integrate AI selectively.

Potential capabilities:

1. Personalized recommendations.
2. Community discovery assistant.
3. Event recommendations.
4. Spam detection.
5. Content moderation assistance.
6. Community content categorization.

AI must not:

- Infer medical diagnoses.
- Infer sensitive characteristics from images.
- Assign attractiveness scores.
- Rank people based on physical characteristics.
- Make consequential moderation decisions without appropriate human review.

Make AI recommendations explainable and configurable.

Do not introduce expensive AI infrastructure before identifying a genuine product need.

---

## 20. DATABASE REQUIREMENTS

Design a normalized, scalable PostgreSQL database.

Core domains must include:

- Users.
- Accounts.
- Sessions.
- Profiles.
- Profile photographs.
- Preferences.
- Verification requests.
- Verification results.
- Likes.
- Passes.
- Matches.
- Connections.
- Posts.
- Comments.
- Reactions.
- Stories.
- Communities.
- Community memberships.
- Discussions.
- Conversations.
- Conversation participants.
- Messages.
- Events.
- Venues.
- RSVPs.
- Tickets.
- Organizations.
- Opportunities.
- Applications.
- Reports.
- Blocks.
- Moderation cases.
- Subscriptions.
- Plans.
- Transactions.
- Notifications.
- Notification preferences.
- Staff roles.
- Permissions.
- Audit logs.

Use appropriate:

- Foreign keys.
- Unique constraints.
- Database indexes.
- Transactions.
- Cascading policies.
- Soft deletion where justified.
- Data retention policies.

Separate sensitive verification records from public profile records.

Use Drizzle migrations and maintain a reliable migration history.

Do not create unnecessary tables merely to mirror this list. Establish the actual domain relationships first.

---

## 21. ADMINISTRATION

Develop a separate staff application.

Modules:

- Dashboard.
- Member management.
- Verification management.
- Moderation.
- Reports.
- Appeals.
- Community management.
- Event management.
- Organization management.
- Subscription management.
- Payments.
- Analytics.
- System settings.
- Staff permissions.
- Audit logs.

Implement role-based and permission-based authorization.

All sensitive staff actions must be logged.

Do not give every administrator unrestricted access.

---

## 22. SECURITY AND COMPLIANCE

Implement security from the beginning.

Requirements:

- OWASP-aligned security.
- Secure session handling.
- CSRF protection where applicable.
- XSS protection.
- Input validation.
- SQL injection prevention.
- Rate limiting.
- Secure file uploads.
- Encryption in transit.
- Encryption at rest.
- Secret management.
- Audit logging.
- Access control.
- Backup procedures.
- Disaster recovery.
- Account deletion.
- Data export.
- Consent management.

Account for GDPR, UK GDPR, Kenya's Data Protection Act and other applicable jurisdictional requirements.

Treat health and disability-related data as potentially sensitive personal data.

Do not collect such information unnecessarily.

Include a privacy impact assessment before introducing sensitive data processing or high-risk profiling.

Prepare the architecture for international data protection requirements without claiming compliance before legal and technical verification.

---

## 23. INTERNATIONALIZATION

Design for international adoption.

Support:

- Multiple languages.
- Regional date formats.
- Time zones.
- Localized currency.
- Regional payment methods.
- Country-specific configuration.
- Accessible localization.
- Translation-ready content.

Do not hardcode Kenya, the United States or any other country into business logic.

The initial application language can be English, with localization architecture established from the beginning.

---

## 24. TESTING REQUIREMENTS

Every module must have appropriate tests.

### Unit tests
- Validation.
- Business logic.
- Permissions.
- Matching rules.
- Subscription entitlements.
- Privacy controls.

### Integration tests
- Authentication.
- Database operations.
- Messaging.
- Payment webhooks.
- File uploads.
- Moderation workflows.
- Notifications.

### End-to-end tests
- Registration.
- Onboarding.
- Profile creation.
- Discovery.
- Matching.
- Messaging.
- Community participation.
- Event creation.
- Reporting.
- Subscription purchase.
- Account deletion.

### Security tests
- Unauthorized access.
- Privilege escalation.
- Cross-user data leakage.
- IDOR.
- Rate-limit bypass.
- File upload vulnerabilities.
- Session security.
- Payment webhook manipulation.

Never consider a module complete without tests for its important business rules.

---

## 25. IMPLEMENTATION PHASES

Follow this sequence.

### PHASE 0 — Repository and architecture audit

Inspect existing code, document findings, identify dependencies and establish the implementation plan.

Do not start rebuilding the application before understanding what exists.

### PHASE 1 — Foundation

- Brand system.
- Public website.
- Authentication.
- Onboarding.
- Profiles.
- Privacy.
- Age eligibility.
- Verification foundation.
- Administration foundation.

### PHASE 2 — Discovery

- Search.
- Filters.
- Recommendations.
- Friendship connections.
- Likes.
- Mutual matching.

### PHASE 3 — Dating and messaging

- Dating experience.
- Relationship preferences.
- Matching.
- Conversations.
- Messaging.
- Notifications.
- Safety controls.

### PHASE 4 — Community

- Social feed.
- Posts.
- Comments.
- Reactions.
- Groups.
- Discussions.
- Stories.
- Moderation.

### PHASE 5 — Events and business

- Events.
- Meetups.
- Organizations.
- Opportunities.
- Payments.
- Subscriptions.
- Monetization.

### PHASE 6 — Global expansion

- Global community map.
- Mobile applications.
- Localization.
- Advanced AI.
- Advanced analytics.
- International partnerships.
- Scaling and optimization.

---

## 26. PHASE COMPLETION RULES

A phase is complete only when:

1. All required features are implemented.
2. Database migrations work.
3. API validation works.
4. Permissions are enforced server-side.
5. UI states are complete.
6. Tests pass.
7. Existing functionality remains intact.
8. Security checks are completed.
9. Documentation is updated.
10. There are no unresolved critical defects.

At the end of every phase:

- Update PROJECT_STATUS.md.
- Update TODO.md.
- Update CHANGELOG.md.
- Record completed features.
- Record remaining work.
- Record test results.
- Record architectural decisions.
- Identify dependencies for the next phase.

Do not silently skip incomplete functionality.

---

## 27. FINAL EXECUTION INSTRUCTIONS

Start with PHASE 0.

Use available agents for parallel research and independent codebase analysis.

Produce an implementation report before making significant modifications.

Then proceed through the phases in dependency order.

Prioritize a functional, secure, polished product over an impressive collection of unfinished screens.

Build reusable components and shared services.

Do not introduce placeholder buttons, fake interactions or frontend-only functionality.

Do not sacrifice security or privacy to save development time.

Do not overengineer.

Do not waste tokens repeatedly reading or rewriting existing files.

If a requirement is ambiguous, inspect the surrounding implementation and documentation first. Ask for clarification only when a genuine product or architectural decision cannot safely be inferred.

**ULTIMATE OBJECTIVE**

Deliver KINORA as a polished, production-ready, global social platform where people of short stature can build meaningful relationships, friendships, communities and opportunities, while people of all heights can participate respectfully.

The product must be technically sound, commercially sustainable, inclusive, accessible, secure and capable of growing internationally.

Begin with the repository audit. Do not attempt to build everything in one uncontrolled operation.