import { defineCollection, z } from 'astro:content';

export const collections = {
	work: defineCollection({
		type: 'content',
		schema: z.object({
			title: z.string(),
			description: z.string(),
			tech:z.array(z.string()),
			publishDate: z.coerce.date(),
			number:z.number(),
			tags: z.array(z.string()),
			img: z.string(),
			img_alt: z.string().optional(),
			github: z.string().optional(),
			liveDemo: z.string().optional(),
			device: z.string().optional(),
			isBeta: z.boolean().optional(),
			// New case study fields
			client: z.string().optional(),
			services: z.array(z.string()).optional(),
			projectType: z.string().optional(),
			duration: z.string().optional(),
			challenge: z.string().optional(),
			solution: z.string().optional(),
			additionalImages: z.array(z.object({
				url: z.string(),
				alt: z.string().optional(),
				caption: z.string().optional()
			})).optional(),
			features: z.array(z.object({
				id: z.string(),
				title: z.string(),
				description: z.string(),
				details: z.string(),
				technologies: z.array(z.string()).optional()
			})).optional(),
			demoVideo: z.object({
				src: z.string(),
				poster: z.string().optional(),
				title: z.string().optional(),
				description: z.string().optional()
			}).optional(),
		}),
	}),
	widgetCss: defineCollection({
		type: 'content',
		schema: z.object({
			title: z.string(),
			href: z.string(),
			description: z.string(),
			publishDate: z.coerce.date(),
			img: z.string(),
			img_alt: z.string().optional(),
		}),
	}),
};
