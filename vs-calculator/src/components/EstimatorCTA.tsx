
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import AnimatedText from "./AnimatedText";

const EstimatorCTA = () => {
  const navigate = useNavigate();
  
  return (
    <section className="py-24 px-6 bg-vs/5">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center size-20 rounded-full bg-vs/10 border-4 border-vs/20 mb-6"
          >
            <Calculator className="size-8 text-vs" />
          </motion.div>
          
          <AnimatedText 
            text="Curious about project costs?"
            className="text-3xl md:text-5xl font-display mb-6"
          />
          
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Try our interactive cost estimator to get an idea of what your vision might cost. 
            Answer a few simple questions and receive a tailored estimate for your project.
          </p>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/estimator')}
            className="px-8 py-4 bg-vs hover:bg-vs-light text-white rounded-full transition-all duration-300 text-lg font-medium shadow-lg hover:shadow-xl"
          >
            Estimate Your Project
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default EstimatorCTA;
