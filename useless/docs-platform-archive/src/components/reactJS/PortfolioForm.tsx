// import { useState } from 'react';
// import type { ChangeEvent, FormEvent } from 'react';
// import { createClient } from '@supabase/supabase-js';
// import { z } from 'zod';

// interface PortfolioProject {
//   github_link: string;
//   technologies: string;
//   title: string;
//   allimage: string;
//   description: string;
//   more_information: string;
//   website: string;
// }

// // Utilisez cette interface pour typer votre state et valider les données avant l'envoi

// // Définir le schéma avec Zod
// const portfolioProjectSchema = z.object({
//   github_link: z.string().url(),
//   technologies: z.string().min(1, "Les technologies sont requises"),
//   title: z.string().min(1, "Le titre est requis"),
//   allimage: z.string().url(),
//   description: z.string().min(1, "La description est requise"),
//   more_information: z.string().min(1, "Plus d'informations sont requises"),
//   website: z.string().url()
// });

// // Initialisation de Supabase
// const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseAnonKey) {
//   console.error('Missing Supabase environment variables');
// }

// const supabase = createClient(supabaseUrl, supabaseAnonKey);

// export default function PortfolioForm() {
//   const [formData, setFormData] = useState<PortfolioProject>({
//     github_link: '',
//     technologies: '',
//     title: '',
//     allimage: '',
//     description: '',
//     more_information: '',
//     website: ''
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setIsSubmitting(true);

//     // Validation du formulaire avec Zod
//     const validation = portfolioProjectSchema.safeParse(formData);
//     if (!validation.success) {
//       const errors = validation.error.errors.map(err => err.message).join(", ");
//       alert("Erreur de validation : " + errors);
//       setIsSubmitting(false);
//       return;
//     }

//     try {
//       console.log("Tentative d'insertion avec les données:", validation.data);
//       const { data, error } = await supabase
//         .from('portfolio_project')
//         .insert([validation.data]);
    
//       console.log("Réponse de Supabase:", { data, error });
    
//       if (error) {
//         alert("Erreur : " + error.message);
//         console.error("Supabase Error:", error);
//       } else {
//         alert("Projet ajouté avec succès !");
//         setFormData({
//           github_link: '',
//           technologies: '',
//           title: '',
//           allimage: '',
//           description: '',
//           more_information: '',
//           website: ''
//         });
//       }
//     } catch (err) {
//       console.error("Erreur inattendue :", err);
//       alert("Une erreur inattendue s'est produite. Vérifiez la console pour plus de détails.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md">
//       <h2 className="text-2xl font-bold mb-6 text-center text-gray-0 dark:text-gray-0">Add New Portfolio Project</h2>

//       <form onSubmit={handleSubmit} id="portfolioForm" className="space-y-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {/* Left column */}
//           <div className="space-y-6">
//             <div className="relative">
//               <label htmlFor="title" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Project Title
//               </label>
//               <input
//                 type="text"
//                 id="title"
//                 name="title"
//                 value={formData.title}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300"
//                 placeholder="Enter project title"
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="technologies" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Technologies Used
//               </label>
//               <input
//                 type="text"
//                 id="technologies"
//                 name="technologies"
//                 value={formData.technologies}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300"
//                 placeholder="React, Node.js, MongoDB, etc."
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="github_link" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 GitHub Link
//               </label>
//               <input
//                 type="url"
//                 id="github_link"
//                 name="github_link"
//                 value={formData.github_link}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300"
//                 placeholder="https://github.com/username/repo"
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="website" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Live Website URL
//               </label>
//               <input
//                 type="url"
//                 id="website"
//                 name="website"
//                 value={formData.website}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300"
//                 placeholder="https://yourproject.com"
//               />
//             </div>
//           </div>

//           {/* Right column */}
//           <div className="space-y-6">
//             <div className="relative">
//               <label htmlFor="allimage" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Image URL
//               </label>
//               <input
//                 type="text"
//                 id="allimage"
//                 name="allimage"
//                 value={formData.allimage}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300"
//                 placeholder="https://example.com/image.jpg"
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="description" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Short Description
//               </label>
//               <textarea
//                 id="description"
//                 name="description"
//                 value={formData.description}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 rows={3}
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300 resize-none"
//                 placeholder="Brief description of your project"
//               />
//             </div>

//             <div className="relative">
//               <label htmlFor="more_information" className="block text-sm font-medium text-gray-0 dark:text-gray-200 mb-1">
//                 Detailed Information
//               </label>
//               <textarea
//                 id="more_information"
//                 name="more_information"
//                 value={formData.more_information}
//                 onChange={handleChange}
//                 required
//                 aria-required="true"
//                 rows={5}
//                 className="w-full px-4 py-3 bg-gray-900 dark:bg-gray-100 text-gray-0 dark:text-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-regular transition-all duration-300 resize-none"
//                 placeholder="Detailed information about your project"
//               />
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-center mt-8">
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className={`px-8 py-3 bg-gradient-to-r from-accent-light to-accent-regular text-white font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-accent-regular focus:ring-offset-2 transform transition-all duration-300 hover:scale-105 shadow-md ${
//               isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-accent-regular hover:to-accent-dark'
//             }`}
//           >
//             {isSubmitting ? 'Submitting...' : 'Add Project'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }