import { LeafMeta, RootNode } from 'src/types';
import { z } from 'zod';

export const RootNodeSchema = z.custom<RootNode>();

export type RootNodeData = z.infer<typeof RootNodeSchema>;

export const LeafMetaSchema = z.custom<LeafMeta>();

export type LeafMetaData = z.infer<typeof LeafMetaSchema>;

export const StatusSchema = z.enum(["success", "error", "fail"]);

export const RootNodeResponseSchema = z.object({
    data: RootNodeSchema,
    status: StatusSchema
});

export const LeafNodesResponseSchema = z.object({
    status: StatusSchema,
    data: z.object({
        nodes: z.array(LeafMetaSchema),
        total: z.number()
    }),
});
