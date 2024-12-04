const Service = require('../Models/service.model');
const { Prestataire } = require('../Models/prestataire.model');

exports.createService = async (req, res) => {
  try {
    const { prestataireId, nom, description, prix, caracteristiques } = req.body;

    const prestataire = await Prestataire.findOne({ user: prestataireId });
    if (!prestataire) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    const newService = new Service({
      prestataire: prestataire._id,
      nom,
      description,
      prix,
      caracteristiques
    });

    await newService.save();

    res.status(201).json({
      success: true,
      data: newService
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du service'
    });
  }
};

exports.getServicesByPrestataire = async (req, res) => {
  try {
    const { id } = req.params;
    const prestataire = await Prestataire.findOne({ user: id });
    
    if (!prestataire) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    const services = await Service.find({ 
      prestataire: prestataire._id,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des services'
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedService = await Service.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedService) {
      return res.status(404).json({
        success: false,
        error: 'Service non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du service'
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur Backend:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du service'
    });
  }
}; 