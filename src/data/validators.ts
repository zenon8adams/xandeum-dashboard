import { Validator } from '../types';

export const validators: Validator[] = [
    { 
        name: 'Reinheim', 
        version: '0.8',
        color: '#9945FF', 
        description: `Reinheim (v0.8) is a focused, small release in Xandeum's South Era, delivering directory tree name searching via glob patterns to make large file systems significantly more navigable for sedApps and operators.`,
        docsLink: 'https://www.xandeum.network/docs'
    },
    { 
        name: 'Heidelberg', 
        version: '0.7',
        color: '#14F195', 
        description: `Heidelberg (v0.7) advances Xandeum's South Era by introducing comprehensive paging statistics, enabling detailed monitoring and optimization of data pages in file systems.`,
        docsLink: 'https://www.xandeum.network/docs'
    },
    { 
        name: 'Stuttgart', 
        version: '0.6',
        color: '#00D4FF', 
        description: `Stuttgart (v0.6) advances Xandeum's South Era by introducing redundancy mechanisms to the scalable storage layer for Solana, enhancing fault tolerance and data durability for smart contracts.`,
        docsLink: 'https://www.xandeum.network/docs'
    },
    { 
        name: 'Ingolstadt', 
        version: '0.5',
        color: '#F59E0B', 
        description: `The Ingolstadt release in Xandeum's South Era shifts focus to reward tracking and performance incentives, introducing a heartbeat credit systems, useing metrics to assess pNode performance. `,
        docsLink: 'https://www.xandeum.network/docs'
    },
    { 
        name: 'Herrenberg', 
        version: '0.4',
        color: '#EF4444', 
        description: `Herrenberg shifted focus to enhanced communication, reliability, and tools for sedApps.`,
        docsLink: 'https://www.xandeum.network/docs'
    },
    { 
        name: 'TryNet', 
        version: '0.8.0-trynet.20251217111503.7a5b024',
        color: '#EC4899', 
        description: 'Node for testing purposes',
        docsLink: 'https://www.xandeum.network/docs'
    },
    {
        name: 'TryNet',
        version: '0.8.0-trynet.20251212183600.9eea72e',
        color: '#8B5CF6',
        description: 'Node for testing purposes',
        docsLink: 'https://www.xandeum.network/docs'
    },
    {
        name: 'Custom',
        version: 'custom',
        color: '#6B7280',
        description: 'Nodes running custom or unrecognized validator versions',
        docsLink: 'https://www.xandeum.network/docs'
    }
];