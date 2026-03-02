# Organization API

This directory contains the API layer for the organization feature.

## Files

- `organizationApi.ts` - API functions for CRUD operations on organizations

## Usage

The organization store now uses real API calls with comprehensive server seed data.

### Real API Integration

The organization store is now configured to use the real API:

- **Server Seed Data**: Organizations, People, Members, Entities, Tasks, and Checklists
- **Real API Calls**: All CRUD operations go through the server
- **Type Safety**: Full TypeScript integration with generated models

### API Endpoints

The following endpoints are implemented on the server:

- `GET /api/access/organization` - List organizations with pagination, search, and sorting
- `GET /api/access/organization/{id}` - Get organization details
- `POST /api/access/organization` - Create a new organization
- `PUT /api/access/organization` - Update an existing organization
- `DELETE /api/access/organization/{id}` - Delete an organization

### Pagination Support

The API supports server-side pagination and sorting:

- `take` - Number of items per page
- `skip` - Number of items to skip (for pagination)
- `search` - Search term for filtering
- `column` - Column to sort by
- `direction` - Sort direction ('asc' or 'desc')

### Error Handling

All API functions include proper error handling and will throw meaningful error messages that are displayed to the user.

### Migration from Mock Data

The mock data has been successfully migrated to server seed data. The client now uses real API calls with realistic test data that matches the previous mock structure.
