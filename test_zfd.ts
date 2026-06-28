import { z } from 'zod';
import { zfd } from 'zod-form-data';

const schema = zfd.formData({
  name: zfd.text(z.string().min(1, "Name is required")),
  price: zfd.numeric(),
  image: z.instanceof(File).optional()
});

const fd = new FormData();
fd.append('name', 'Burger');
fd.append('price', '10');

console.log(schema.parse(fd));
