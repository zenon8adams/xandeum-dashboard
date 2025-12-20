import { Validator } from '../types';

export const validators: Validator[] = [
    { 
        name: 'Herrenberg', 
        version: '1.17.4',
        color: '#FF5733',
        description: 'Latest stable release with performance optimizations and enhanced security features. Recommended for production environments.',
        docsLink: 'https://docs.xandeum.network/v1.17.4'
    },
    { 
        name: 'Ingolstadt', 
        version: '1.17.3',
        color: '#33FF57',
        description: 'Stable version with proven reliability. Includes critical bug fixes and network stability improvements.',
        docsLink: 'https://docs.xandeum.network/v1.17.3'
    },
    { 
        name: 'Stuttgart', 
        version: '1.17.2',
        color: '#3357FF',
        description: 'Previous stable release. Maintains compatibility with legacy systems while offering solid performance.',
        docsLink: 'https://docs.xandeum.network/v1.17.2'
    },
    { 
        name: 'Heidelberg', 
        version: '1.17.1',
        color: '#F333FF',
        description: 'Early adoption release with new consensus improvements. Suitable for testing environments.',
        docsLink: 'https://docs.xandeum.network/v1.17.1'
    },
    { 
        name: 'Try', 
        version: '1.17.0',
        color: '#FF33A8',
        description: 'Initial release of the 1.17 series. Foundation for all subsequent improvements and optimizations.',
        docsLink: 'https://docs.xandeum.network/v1.17.0'
    },
];