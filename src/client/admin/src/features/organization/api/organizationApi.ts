import { get as apiGet, post, put, del, makePageQueryString } from '$/api';
import { ApiError } from '$/api/ApiError';
import type { OrganizationModel, OrganizationDetailModel } from '$/models/access';
import type { PagedQuery, PagedResult } from '$/models';

// API paths - updated to match server controller endpoints
const LIST_API_PATH = '/api/access/organization';
const DETAILS_API_PATH = '/api/access/organization/{id}/detail';
const CREATE_API_PATH = '/api/access/organization';
const UPDATE_API_PATH = '/api/access/organization';
const DELETE_API_PATH = '/api/access/organization/{id}';

/**
 * Fetch a paginated list of organizations
 */
export const fetchOrganizations = async (
  page: number = 1,
  pageSize: number = 10,
  search?: string,
  sorting?: Array<{ id: string; desc: boolean }>
): Promise<{ items: OrganizationModel[], totalCount: number }> => {
  const pageQuery: PagedQuery = {
    limit: pageSize,
    page: page, // API uses 1-based page indexing
    search: search || undefined,
    column: sorting && sorting.length > 0 ? [sorting[0].id] : undefined,
    direction: sorting && sorting.length > 0 ? [sorting[0].desc ? 'desc' : 'asc'] : undefined,
  };

  try {
    const queryString = makePageQueryString(pageQuery);
    const response = await apiGet(LIST_API_PATH + queryString);

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to fetch organizations');
      throw apiError;
    }

    const result = await response.json() as PagedResult<OrganizationModel>;
    return {
      items: result.items,
      totalCount: result.count,
    };
  } catch (error) {
    throw new Error(ApiError.extractErrorMessage(error));
  }
};

/**
 * Fetch organization details by ID
 */
export const fetchOrganizationDetails = async (id: number): Promise<OrganizationDetailModel> => {
  try {
    const response = await apiGet(DETAILS_API_PATH.replace('{id}', encodeURIComponent(id.toString())));

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to fetch organization details');
      throw apiError;
    }

    return await response.json() as OrganizationDetailModel;
  } catch (error) {
    throw new Error(ApiError.extractErrorMessage(error));
  }
};

/**
 * Create a new organization
 */
export const createOrganization = async (organization: Omit<OrganizationModel, 'id'>): Promise<OrganizationModel> => {
  try {
    const response = await post(CREATE_API_PATH, organization);

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to create organization');
      throw apiError;
    }

    return await response.json() as OrganizationModel;
  } catch (error) {
    throw new Error(ApiError.extractErrorMessage(error));
  }
};

/**
 * Update an existing organization
 */
export const updateOrganization = async (organization: OrganizationModel): Promise<OrganizationModel> => {
  try {
    const response = await put(UPDATE_API_PATH, organization);

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to update organization');
      throw apiError;
    }

    return await response.json() as OrganizationModel;
  } catch (error) {
    throw new Error(ApiError.extractErrorMessage(error));
  }
};

/**
 * Delete an organization
 */
export const deleteOrganization = async (id: number): Promise<void> => {
  try {
    const response = await del(DELETE_API_PATH.replace('{id}', encodeURIComponent(id.toString())));

    if (!response.ok) {
      const apiError = await ApiError.fromResponse(response, 'Failed to delete organization');
      throw apiError;
    }
  } catch (error) {
    throw new Error(ApiError.extractErrorMessage(error));
  }
};
