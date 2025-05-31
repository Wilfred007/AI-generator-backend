import userModel from "../models/userModel.js";
import formData from 'form-data';
import axios from 'axios';

export const generateImage = async (req, res) => {
    try {
        const userId = req.userId;
        const { prompt } = req.body;

        const user = await userModel.findById(userId);

        if (!user || !prompt) {
            return res.json({ success: false, message: 'Missing Details' });
        }

        if (user.creditBalance <= 0) {
            return res.json({ success: false, message: 'Not enough credits', creditBalance: user.creditBalance });
        }

        const form = new formData();
        form.append('prompt', prompt);

        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', form, {
            headers: {
                'x-api-key': process.env.CLIPDROP_API,
                ...form.getHeaders()
            },
            responseType: 'arraybuffer'
        });

        const base64Image = Buffer.from(data, 'binary').toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;

        const updatedBalance = user.creditBalance - 1;
        await userModel.findByIdAndUpdate(user._id, { creditBalance: updatedBalance });

        res.json({
            success: true,
            message: 'Image Generated',
            creditBalance: updatedBalance,
            resultImage
        });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
