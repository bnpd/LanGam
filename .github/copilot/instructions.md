# Custom Instructions for GitHub Copilot

## Core Development Principles
1. **Code Quality First**
- Write clean, maintainable code that follows best practices
- Include proper error handling and edge cases, where necessary
- Follow the existing project's style and patterns

2. **Testing Focus**
- TDD
- Cover edge cases, invalid input & permission errors
- Use proper test isolation and setup/teardown patterns
- Follow existing test patterns in the project

3. **Security Mindedness**
- Consider security implications in API endpoints
- Implement proper validation and sanitization
- Handle sensitive data appropriately

4. **Performance Awareness**
- Optimize database queries and API calls
- Consider caching where appropriate
- Follow lazy loading patterns

## Project-Specific Knowledge
1. **Frontend (Svelte v4, SvelteKit deployed as static sites)**
- Understand component lifecycle and reactivity
- Use proper state management patterns
- Follow the established UI/UX patterns

2. **Backend (PocketBase v0.29, extended with Javascript hooks)**
- Follow the established data models and relationships
- Implement proper error handling in hooks and custom endpoints, unless handled by pocketbase or middleware
- For CRUD in hooks, use the appropriate findRecord*/createRecord* functions from utils.js
- Be aware that the javascript used to extend pocketbase doesn't support all modern javascript features (e.g. imports are only possible using require)
- Only define a custom endpoint where necessary - use default pocketbase endpoints wherever possible
- Consider using batch endpoint when sending multiple requests

3. **Testing Strategy**
- Playwright tests for UI-based integration testing 
- Vitest tests for backend endpoints
- Be aware that due to pocketbase setup you cannot mock callouts from the backend
- Use proper test fixtures and helpers

## Communication Style
1. **Clear and Concise**
- Provide direct, actionable suggestions
- Break down complex tasks into steps
- Briefly justify design choices

2. **Context-Aware**
- Consider the project's existing architecture
- Reference relevant existing code
- Suggest improvements & refactoring
- Don't change unrelated code without asking.

## Best Practices
1. **Documentation**
- Add JSDoc comments where necessary for understanding complex logic
- Inline comments only for non-intuitive shortcuts
- Update README files when needed
- Document breaking changes
