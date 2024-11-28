const { Prestataire } = require('../../Models/prestataire.model');

exports.updatePrestataireSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const prestataireSearch = await Prestataire.findOne({ user: id });
    
    if (!prestataireSearch) {
      return res.status(404).json({
        success: false,
        error: 'Prestataire non trouvé'
      });
    }

    const updatedPrestataire = await Prestataire.findByIdAndUpdate(
      prestataireSearch._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedPrestataire
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour des paramètres'
    });
  }
}; 