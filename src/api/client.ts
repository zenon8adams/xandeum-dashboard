import axios from 'axios';
import {
  RootNodeResponseSchema,
  LeafNodesResponseSchema,
  type RootNodeData,
  type LeafMetaData
} from './schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch root node data from /pnode/root
 */
export async function fetchRootNode(): Promise<RootNodeData> {
  const response = await apiClient.get('/pnode/root');
  const validated = RootNodeResponseSchema.parse(response.data);
  return validated.data;
}

/**
 * Fetch leaf nodes from /pnode/leaf with pagination
 */
export async function fetchLeafNodes(): Promise<LeafMetaData[]> {
  const response = await apiClient.get('/pnode/leaf');
  const validated = LeafNodesResponseSchema.parse(response.data);
  return validated.data.nodes;
}

/**
 * Fetch all leaf nodes with pagination
 */
export async function fetchAllLeafNodes(): Promise<LeafMetaData[]> {
  return await fetchLeafNodes();
}

/**
 * query information about node
 */
export async function queryNode(arg: string, endpoint: string) {
  const response = await apiClient.get(`/pnode/run-command/${arg}?endpoint=${endpoint}`);
  if (response.status !== 200) {
    throw new Error(`Error: Request failed with status ${response.status}`);
  }

  return response.data;
}

/**
 * Smart query to find best leaf endpoints
 * @returns {Promise<string[]>} Array of endpoint strings
 */
export async function smartQuery(prompt: string): Promise<string[]> {
  try {
    const response = await apiClient.post('/pnode/generative/find-best-leaf-endpoint', {
      prompt
    });
    if (response.status !== 200) {
      throw new Error(`No node found`);
    }
    if (response.data.status === 'success' && Array.isArray(response.data.endpoints)) {
      return response.data.endpoints;
    } else {
      throw new Error(`No node found`);
    }
  } catch (error) {
    throw new Error(`No node found`);
  }
}