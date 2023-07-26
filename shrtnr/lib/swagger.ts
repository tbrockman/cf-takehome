import { createSwaggerSpec } from 'next-swagger-doc'

export const getApiDocs = async () => {
	const spec = createSwaggerSpec({
		apiFolder: 'app/api',
		definition: {
			openapi: '3.0.0',
			info: {
				title: 'shrtnr API',
				version: '1.0',
			},
			components: {},
			security: [],
		},
	})
	return spec
}