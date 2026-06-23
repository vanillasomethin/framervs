
import { motion } from "framer-motion";

const FooterInfo = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-vs/10 p-2 rounded-full">
            <span className="font-medium text-vs">IND</span>
          </div>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <h3 className="font-medium text-lg mb-2">Mangalore</h3>
        <address className="not-italic text-muted-foreground">
          #13, Highland Manor<br />
          Kankanady, Mangalore 575002
        </address>
        <div className="mt-4 text-sm text-vs">
          <a href="tel:+919876543210" className="block hover:underline">+91 987 654 3210</a>
          <a href="mailto:info@vanillandsomethin.com" className="block hover:underline">info@vanillandsomethin.com</a>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-vs/10 p-2 rounded-full">
            <span className="font-medium text-vs">KSA</span>
          </div>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <h3 className="font-medium text-lg mb-2">Riyadh</h3>
        <address className="not-italic text-muted-foreground">
          #7947, Abu Saad Al Wazir<br />
          Al Malqa, Riyadh 13524
        </address>
        <div className="mt-4 text-sm text-vs">
          <a href="tel:+966512345678" className="block hover:underline">+966 51 234 5678</a>
          <a href="mailto:ksa@vanillandsomethin.com" className="block hover:underline">ksa@vanillandsomethin.com</a>
        </div>
      </motion.div>
    </div>
  );
};

export default FooterInfo;
