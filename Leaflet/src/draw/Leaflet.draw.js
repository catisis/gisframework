/*
 * Leaflet.draw assumes that you have already included the Leaflet library.
 */

L.drawVersion = '0.2.4-dev';

L.drawLocal = {
	draw: {
		toolbar: {
			actions: {
				title: '取消绘制',
				text: '取消'
			},
			undo: {
				title: '删除上一个编辑点',
				text: '返回'
			},
			buttons: {
				polyline: '绘制折线',
				polygon: '绘制面',
				rectangle: '绘制矩形',
				circle: '绘制圆形',
				marker: '绘制点'
			}
		},
		handlers: {
			circle: {
				tooltip: {
					start: '点击地图然后拖拽绘制圆'
				},
				radius: 'Radius'
			},
			marker: {
				tooltip: {
					start: '点击地图绘制点'
				}
			},
			polygon: {
				tooltip: {
					start: '点击地图开始绘制',
					cont: '点击继续绘制,CTRL+Z返回上一个编辑点，ESC取消绘制',
					end: '点击起点结束绘制,CTRL+Z返回上一个编辑点，ESC取消绘制'
				}
			},
			polyline: {
				error: '<strong>错误:</strong> 绘制错误!',
				tooltip: {
					start: '点击地图开始绘制',
					cont: '点击继续绘制,CTRL+Z返回上一个编辑点，ESC取消绘制',
					end: '点击绘制终点结束绘制,CTRL+Z返回上一个编辑点，ESC取消绘制'
				}
			},
			rectangle: {
				tooltip: {
					start: '点击并且拖拽绘制。'
				}
			},
			simpleshape: {
				tooltip: {
					end: '鼠标抬起结束绘制'
				}
			}
		}
	},
	edit: {
		toolbar: {
			actions: {
				save: {
					title: '保存修改',
					text: '保存'
				},
				cancel: {
					title: '取消编辑',
					text: '取消'
				}
			},
			buttons: {
				edit: '编辑地图',
				editDisabled: '没有可编辑的图层',
				remove: '删除图层',
				removeDisabled: '没有图层可以删除'
			}
		},
		handlers: {
			edit: {
				tooltip: {
					text: '点击拖拽地图节点编辑地图',
					subtext: '点击取消返回上一步编辑状态'
				}
			},
			remove: {
				tooltip: {
					text: '点击删除要素'
				}
			}
		}
	}
};
